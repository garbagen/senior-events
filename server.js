// server.js
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as db from './db.js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// For Railway deployment, serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Your calendar ID from Google Calendar
const CALENDAR_ID = process.env.CALENDAR_ID || 'c_5a1929868d3d87d69d4b19fc0f3b13ebfb86d8a40dbe5a855c0f80cf464f3757@group.calendar.google.com';

// Initialize Google Calendar API with service account
let calendar;
try {
  // Try to parse the service account JSON from environment variable
  let credentials;
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('Error parsing GOOGLE_SERVICE_ACCOUNT JSON:', e);
      credentials = {};
    }
  } else {
    // Try to load from local file (for local development)
    try {
      const serviceAccountPath = path.join(__dirname, 'service-account.json');
      const serviceAccountContent = await fs.readFile(serviceAccountPath, 'utf-8');
      credentials = JSON.parse(serviceAccountContent);
    } catch (e) {
      console.error('Error loading service-account.json:', e);
      credentials = {};
    }
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  calendar = google.calendar({ version: 'v3', auth });
  console.log('Google Calendar API initialized successfully');
} catch (error) {
  console.error('Error initializing Google Calendar API:', error);
  // Create a fallback for testing purposes
  calendar = {
    events: {
      list: async () => {
        console.log('Using mock calendar data');
        return {
          data: {
            items: [
              {
                id: 'mock1',
                summary: 'Evento de prueba 1',
                description: 'Una descripción para el evento de prueba',
                location: 'Centro comunitario',
                start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
                end: { dateTime: new Date(Date.now() + 86400000 + 3600000).toISOString() }
              },
              {
                id: 'mock2',
                summary: 'Evento de prueba 2',
                description: 'Otra descripción para el evento de prueba',
                location: 'Parque central',
                start: { dateTime: new Date(Date.now() + 172800000).toISOString() },
                end: { dateTime: new Date(Date.now() + 172800000 + 5400000).toISOString() }
              }
            ]
          }
        };
      }
    }
  };
}

// Configure multer for memory storage (for file uploads)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('El archivo debe ser una imagen'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize the database (but don't stop the server if it fails)
db.initDatabase().catch(error => {
  console.error('Database initialization error (continuing anyway):', error);
});

// Setup file upload directory for local development
const ensureUploadDir = async () => {
  const uploadsDir = path.join(__dirname, 'public', 'uploads', 'events');
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log('Upload directory created:', uploadsDir);
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
};
ensureUploadDir();

// API Routes
app.get('/api/events', async (req, res) => {
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

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// Get all responses for an event
app.get('/api/events/:eventId/responses', async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventResponses = await db.getEventResponses(eventId);
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
    
    await db.saveEventResponse(eventId, userId, responseType, timestamp);
    
    res.status(201).json({ success: true, message: 'Response recorded' });
  } catch (error) {
    console.error('Error recording response:', error);
    res.status(500).json({ error: 'Failed to record response' });
  }
});

// Remove a response
app.delete('/api/events/:eventId/responses/:userId', async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    
    await db.deleteEventResponse(eventId, userId);
    
    res.json({ success: true, message: 'Response removed' });
  } catch (error) {
    console.error('Error removing response:', error);
    res.status(500).json({ error: 'Failed to remove response' });
  }
});

// Get aggregate statistics for all events
app.get('/api/statistics', async (req, res) => {
  try {
    const allResponses = await db.getAllResponses();
    
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
    const eventMetadata = await db.getEventMetadata(eventId);
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
    
    await db.saveEventMetadata(eventId, metadata);
    
    res.status(200).json({ success: true, message: 'Metadata updated successfully' });
  } catch (error) {
    console.error('Error updating event metadata:', error);
    res.status(500).json({ error: 'Failed to update event metadata' });
  }
});

// Local file storage for uploads (as a fallback when S3 is not configured)
const saveLocalFile = async (file, eventId) => {
  const uniqueFilename = `${uuidv4()}-${file.originalname}`;
  const uploadDir = path.join(__dirname, 'public', 'uploads', 'events');
  const filePath = path.join(uploadDir, uniqueFilename);
  
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, file.buffer);
  
  // Return relative path
  return `/uploads/events/${uniqueFilename}`;
};

// Add this endpoint for uploading images
app.post('/api/events/:eventId/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
    }
    
    let imagePath;
    
    // Check if S3 module is available
    try {
      // Try to import S3Storage dynamically
      const { uploadFile } = await import('./s3Storage.js');
      // Upload to S3 and get the URL
      imagePath = await uploadFile(req.file);
      console.log('Image uploaded to S3:', imagePath);
    } catch (s3Error) {
      console.error('Error using S3, falling back to local storage:', s3Error);
      // Fallback to local file storage
      imagePath = await saveLocalFile(req.file, eventId);
      console.log('Image saved locally:', imagePath);
    }
    
    // Update the event metadata with the image path
    await db.saveEventMetadata(eventId, {
      imagePath,
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Imagen subida con éxito',
      imagePath
    });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// For SPA routing, return the main index.html for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Use the PORT environment variable provided by Railway or default to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});