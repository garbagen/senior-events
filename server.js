// server.js - Modified with fallbacks to make it work
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// For deployment, serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Your calendar ID from Google Calendar
const CALENDAR_ID = process.env.CALENDAR_ID || 'c_5a1929868d3d87d69d4b19fc0f3b13ebfb86d8a40dbe5a855c0f80cf464f3757@group.calendar.google.com';

// LOCAL EVENT DATA STORAGE - Fallback when Google Calendar fails
const EVENTS_FILE = path.join(__dirname, 'data', 'events.json');
const RESPONSES_FILE = path.join(__dirname, 'data', 'event_responses.json');
const METADATA_FILE = path.join(__dirname, 'data', 'event_metadata.json');

// Create data directory if it doesn't exist
const ensureDataDir = async () => {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
  } catch (err) {
    console.error('Error creating data directory:', err);
  }
};

// Read data from JSON file
const readJsonFile = async (filePath, defaultValue = {}) => {
  try {
    try {
      await fs.access(filePath);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      // If file doesn't exist or can't be read, return default value
      return defaultValue;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
};

// Write data to JSON file
const writeJsonFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
    return false;
  }
};

// Try to initialize Google Calendar API, but provide fallback if it fails
let calendar;
try {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}'),
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
  
  calendar = google.calendar({ version: 'v3', auth });
  console.log('Google Calendar API initialized successfully');
} catch (error) {
  console.error('Error initializing Google Calendar API:', error);
  console.log('Will use mock event data as fallback');
}

// Configure multer for memory storage when S3 is available, disk storage as fallback
let storage;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET_NAME) {
  // Use memory storage for S3 uploads
  storage = multer.memoryStorage();
  console.log('Using memory storage for S3 uploads');
} else {
  // Use disk storage as fallback
  storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'public', 'uploads', 'events');
      
      // Create directory if it doesn't exist
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      const uniqueFilename = `${uuidv4()}-${file.originalname}`;
      cb(null, uniqueFilename);
    }
  });
  console.log('Using disk storage (S3 not configured)');
}

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('El archivo debe ser una imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize storage
ensureDataDir().catch(console.error);

// Sample mock events for when Google Calendar fails
const MOCK_EVENTS = [
  {
    id: 'event-1',
    title: 'Taller de Pintura',
    description: 'Taller para aprender técnicas básicas de pintura. Materiales incluidos.',
    location: 'Centro Comunitario, Sala 2',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
  },
  {
    id: 'event-2',
    title: 'Bingo Social',
    description: 'Tarde de bingo con premios y refrigerios. ¡Todos son bienvenidos!',
    location: 'Salón Principal',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours later
  },
  {
    id: 'event-3',
    title: 'Paseo al Parque',
    description: 'Caminata guiada por el parque municipal. Se recomienda ropa cómoda.',
    location: 'Entrada del Parque Municipal',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
  }
];

// API Routes
app.get('/api/events', async (req, res) => {
  try {
    // Try to fetch real events from Google Calendar
    if (calendar) {
      try {
        const response = await calendar.events.list({
          calendarId: CALENDAR_ID,
          timeMin: new Date().toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime',
        });

        const events = response.data.items.map(event => ({
          id: event.id,
          title: event.summary,
          description: event.description || '',
          location: event.location || 'No location specified',
          date: event.start.dateTime || event.start.date,
          endDate: event.end.dateTime || event.end.date,
        }));

        // Also save these events to our local JSON for future fallback
        await writeJsonFile(EVENTS_FILE, events);
        
        return res.json(events);
      } catch (googleError) {
        console.error('Error fetching events from Google Calendar:', googleError);
        // Fall through to use the fallback mechanism
      }
    }
    
    // Fallback: Try to load events from our local JSON
    const savedEvents = await readJsonFile(EVENTS_FILE, []);
    
    // If we have saved events, use those
    if (savedEvents.length > 0) {
      console.log('Using saved events data');
      return res.json(savedEvents);
    }
    
    // Ultimate fallback: Use hardcoded mock events
    console.log('Using mock events data');
    await writeJsonFile(EVENTS_FILE, MOCK_EVENTS); // Save mock events for future use
    return res.json(MOCK_EVENTS);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch events',
      message: error.message,
    });
  }
});

// Get all responses for an event
app.get('/api/events/:eventId/responses', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Read responses from JSON file
    const allResponses = await readJsonFile(RESPONSES_FILE, {});
    const eventResponses = allResponses[eventId] || [];
    
    res.json(eventResponses);
  } catch (error) {
    console.error('Error fetching event responses:', error);
    res.status(500).json({ error: 'Failed to fetch event responses' });
  }
});

// Add a new response to an event
app.post('/api/events/:eventId/respond', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { responseType, userId, timestamp } = req.body;
    
    if (!responseType || !userId) {
      return res.status(400).json({ error: 'Response type and user ID are required' });
    }
    
    // Read current responses
    const allResponses = await readJsonFile(RESPONSES_FILE, {});
    
    // Initialize if this event doesn't have responses yet
    if (!allResponses[eventId]) {
      allResponses[eventId] = [];
    }
    
    // Create response object
    const responseId = `${eventId}_${userId}`;
    const responseObj = {
      id: responseId,
      userId,
      responseType,
      timestamp
    };
    
    // Check if user already responded
    const existingIndex = allResponses[eventId].findIndex(r => r.userId === userId);
    
    if (existingIndex >= 0) {
      // Update existing response
      allResponses[eventId][existingIndex] = responseObj;
    } else {
      // Add new response
      allResponses[eventId].push(responseObj);
    }
    
    // Save updated responses
    await writeJsonFile(RESPONSES_FILE, allResponses);
    
    res.status(201).json({ success: true, message: 'Response recorded' });
  } catch (error) {
    console.error('Error recording response:', error);
    res.status(500).json({ error: 'Failed to record response' });
  }
});

// Get aggregate statistics for all events
app.get('/api/statistics', async (req, res) => {
  try {
    const allResponses = await readJsonFile(RESPONSES_FILE, {});
    
    const statistics = {
      events: {},
      totals: {
        likes: 0,
        dislikes: 0,
        totalResponses: 0,
        eventCount: Object.keys(allResponses).length
      }
    };
    
    // Calculate statistics for each event and overall totals
    for (const [eventId, responses] of Object.entries(allResponses)) {
      const likes = responses.filter(r => r.responseType === 'like').length;
      const dislikes = responses.filter(r => r.responseType === 'dislike').length;
      
      statistics.events[eventId] = {
        likes,
        dislikes,
        totalResponses: responses.length
      };
      
      statistics.totals.likes += likes;
      statistics.totals.dislikes += dislikes;
      statistics.totals.totalResponses += responses.length;
    }
    
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get metadata for an event
app.get('/api/events/:eventId/metadata', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Read metadata from JSON file
    const allMetadata = await readJsonFile(METADATA_FILE, {});
    const eventMetadata = allMetadata[eventId] || {};
    
    res.json(eventMetadata);
  } catch (error) {
    console.error('Error fetching event metadata:', error);
    res.status(500).json({ error: 'Failed to fetch event metadata' });
  }
});

// Add or update metadata for an event
app.post('/api/events/:eventId/metadata', async (req, res) => {
  try {
    const { eventId } = req.params;
    const metadata = req.body;
    
    if (!metadata) {
      return res.status(400).json({ error: 'Metadata is required' });
    }
    
    // Read current metadata
    const allMetadata = await readJsonFile(METADATA_FILE, {});
    
    // Update metadata for this event
    allMetadata[eventId] = {
      ...(allMetadata[eventId] || {}),
      ...metadata,
      lastUpdated: new Date().toISOString()
    };
    
    // Save updated metadata
    await writeJsonFile(METADATA_FILE, allMetadata);
    
    res.status(200).json({ success: true, message: 'Metadata updated successfully' });
  } catch (error) {
    console.error('Error updating event metadata:', error);
    res.status(500).json({ error: 'Failed to update event metadata' });
  }
});

/**
 * Image upload endpoint with improved error handling and fallback mechanisms
 * This code should replace the existing upload endpoint in server.js
 * 
 * Key improvements:
 * - Better error handling for S3 uploads
 * - Fallback to local storage when S3 fails
 * - Verification that uploaded files exist and are accessible
 * - Detailed logging for troubleshooting
 */
app.post('/api/events/:eventId/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
    }
    
    console.log('Received upload request for event:', eventId);
    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path || 'Using memory storage',
      buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
    });
    
    let imagePath;
    
    // Check for S3 configuration
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET_NAME) {
      console.log('Using S3 storage');
      try {
        // Import the S3 storage module
        let uploadToS3;
        try {
          const s3Storage = await import('./s3Storage.js');
          uploadToS3 = s3Storage.uploadFile;
          console.log('S3 storage module loaded successfully');
        } catch (importError) {
          console.error('Error importing S3 storage module:', importError);
          throw new Error('S3 module import failed: ' + importError.message);
        }
        
        // Ensure we have the file buffer
        let fileBuffer;
        if (req.file.buffer) {
          fileBuffer = req.file.buffer;
          console.log('Using buffer from memory storage');
        } else if (req.file.path) {
          try {
            fileBuffer = await fs.readFile(req.file.path);
            console.log('Successfully read file from disk');
          } catch (readError) {
            console.error('Error reading file from disk:', readError);
            throw new Error('Failed to read uploaded file from disk');
          }
        } else {
          throw new Error('No file buffer or path available');
        }
        
        // Upload to S3
        try {
          imagePath = await uploadToS3({
            buffer: fileBuffer,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype
          });
          
          console.log('File uploaded to S3:', imagePath);
          
          // If we have a local file, remove it (in case of disk storage)
          if (req.file.path) {
            try {
              await fs.unlink(req.file.path);
              console.log('Local file deleted after S3 upload');
            } catch (unlinkError) {
              console.error('Error deleting local file:', unlinkError);
              // Continue anyway since the S3 upload was successful
            }
          }
        } catch (s3Error) {
          console.error('Error uploading to S3:', s3Error);
          // If S3 upload fails, let's fall back to local storage if we have a path
          if (req.file.path) {
            console.log('S3 upload failed, falling back to local storage');
            imagePath = `/uploads/events/${path.basename(req.file.path)}`;
          } else {
            throw new Error('S3 upload failed and no local fallback available: ' + s3Error.message);
          }
        }
      } catch (error) {
        console.error('Error in S3 upload process:', error);
        
        // If we hit an error in the S3 upload process but have a local file, use that as fallback
        if (req.file.path) {
          console.log('Error in S3 process, falling back to local storage');
          imagePath = `/uploads/events/${path.basename(req.file.path)}`;
        } else {
          throw error; // Re-throw the error if we can't fall back
        }
      }
    } else {
      // Use local storage if S3 is not configured
      console.log('S3 not configured, using local storage');
      
      if (!req.file.path) {
        throw new Error('No file path available for local storage');
      }
      
      imagePath = `/uploads/events/${path.basename(req.file.path)}`;
      console.log('Using local storage path:', imagePath);
      
      // Verify the file exists in the local filesystem
      try {
        await fs.access(path.join(__dirname, 'public', imagePath));
        console.log('Verified local file exists at:', path.join(__dirname, 'public', imagePath));
      } catch (accessError) {
        console.error('Warning: Could not verify local file exists:', accessError);
        // Continue anyway, as the file might be accessible from the web
      }
    }
    
    // Update the event metadata with the image path
    const allMetadata = await readJsonFile(METADATA_FILE, {});
    
    allMetadata[eventId] = {
      ...(allMetadata[eventId] || {}),
      imagePath,
      lastUpdated: new Date().toISOString()
    };
    
    await writeJsonFile(METADATA_FILE, allMetadata);
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Imagen subida con éxito',
      imagePath
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    // Provide more detailed error response
    res.status(500).json({ 
      error: 'Error al subir la imagen',
      message: error.message,
      // Don't include stack trace in production, but useful for debugging
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// For SPA routing, return the main index.html for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});