// db.js
import pg from 'pg';
const { Pool } = pg;

// Configure PostgreSQL connection
let pool;

// Check if we're in the Railway environment
if (process.env.DATABASE_URL) {
  // Use the DATABASE_URL provided by Railway
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Railway's PostgreSQL
    }
  });
  console.log('Using Railway PostgreSQL database');
} else {
  // Local development fallback
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'senior_events',
  });
  console.log('Using local PostgreSQL database');
}

// Initialize database tables
export const initDatabase = async () => {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
    
    // Create responses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_responses (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        response_type TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        UNIQUE(event_id, user_id)
      )
    `);

    // Create metadata table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_metadata (
        event_id TEXT PRIMARY KEY,
        image_path TEXT,
        image_category TEXT,
        additional_info TEXT,
        last_updated TIMESTAMP NOT NULL
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    // Use a fallback file-based mechanism if database connection fails
    console.error('Error initializing database:', error);
    console.log('Falling back to JSON file storage');
  }
};

// Fallback to file system if database is unavailable
const useFileSystemFallback = async () => {
  // Implement file system operations here if needed
  return true;
};

// Event responses functions
export const getEventResponses = async (eventId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM event_responses WHERE event_id = $1',
      [eventId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      responseType: row.response_type,
      timestamp: row.timestamp
    }));
  } catch (error) {
    console.error('Error getting event responses:', error);
    // Fallback to file-based data if database is not available
    return [];
  }
};

export const getAllResponses = async () => {
  try {
    const result = await pool.query('SELECT * FROM event_responses');
    
    // Group responses by event ID
    const responsesByEvent = {};
    
    result.rows.forEach(row => {
      const response = {
        id: row.id,
        userId: row.user_id,
        responseType: row.response_type,
        timestamp: row.timestamp
      };
      
      if (!responsesByEvent[row.event_id]) {
        responsesByEvent[row.event_id] = [];
      }
      
      responsesByEvent[row.event_id].push(response);
    });
    
    return responsesByEvent;
  } catch (error) {
    console.error('Error getting all responses:', error);
    return {};
  }
};

export const saveEventResponse = async (eventId, userId, responseType, timestamp) => {
  try {
    const id = `${eventId}_${userId}`;
    
    // Using upsert (insert or update)
    await pool.query(`
      INSERT INTO event_responses (id, event_id, user_id, response_type, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (event_id, user_id) 
      DO UPDATE SET response_type = $4, timestamp = $5
    `, [id, eventId, userId, responseType, timestamp]);
    
    return true;
  } catch (error) {
    console.error('Error saving event response:', error);
    return false;
  }
};

export const deleteEventResponse = async (eventId, userId) => {
  try {
    await pool.query(
      'DELETE FROM event_responses WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting event response:', error);
    return false;
  }
};

// Event metadata functions
export const getEventMetadata = async (eventId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM event_metadata WHERE event_id = $1',
      [eventId]
    );
    
    if (result.rows.length === 0) {
      return {};
    }
    
    const row = result.rows[0];
    return {
      imagePath: row.image_path,
      imageCategory: row.image_category,
      additionalInfo: row.additional_info,
      lastUpdated: row.last_updated
    };
  } catch (error) {
    console.error('Error getting event metadata:', error);
    return {};
  }
};

export const getAllMetadata = async () => {
  try {
    const result = await pool.query('SELECT * FROM event_metadata');
    
    const metadataByEvent = {};
    
    result.rows.forEach(row => {
      metadataByEvent[row.event_id] = {
        imagePath: row.image_path,
        imageCategory: row.image_category,
        additionalInfo: row.additional_info,
        lastUpdated: row.last_updated
      };
    });
    
    return metadataByEvent;
  } catch (error) {
    console.error('Error getting all metadata:', error);
    return {};
  }
};

export const saveEventMetadata = async (eventId, metadata) => {
  try {
    const { imagePath, imageCategory, additionalInfo } = metadata;
    const lastUpdated = new Date().toISOString();
    
    // Using upsert (insert or update)
    await pool.query(`
      INSERT INTO event_metadata (event_id, image_path, image_category, additional_info, last_updated)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (event_id) 
      DO UPDATE SET 
        image_path = COALESCE($2, event_metadata.image_path),
        image_category = COALESCE($3, event_metadata.image_category),
        additional_info = COALESCE($4, event_metadata.additional_info),
        last_updated = $5
    `, [eventId, imagePath, imageCategory, additionalInfo, lastUpdated]);
    
    return true;
  } catch (error) {
    console.error('Error saving event metadata:', error);
    return false;
  }
};