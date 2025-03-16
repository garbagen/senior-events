// server.js
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Your calendar ID from Google Calendar
const CALENDAR_ID = 'c_5a1929868d3d87d69d4b19fc0f3b13ebfb86d8a40dbe5a855c0f80cf464f3757@group.calendar.google.com';

// Initialize Google Calendar API with service account
const auth = new google.auth.GoogleAuth({
  keyFile: './service-account.json',
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
});

const calendar = google.calendar({ version: 'v3', auth });

// Path to store event responses
const RESPONSES_DIR = path.join(__dirname, 'data');
const RESPONSES_FILE = path.join(RESPONSES_DIR, 'event_responses.json');
const METADATA_FILE = path.join(RESPONSES_DIR, 'event_metadata.json');

// Initialize responses data store
const initializeResponsesStore = async () => {
  try {
    await fs.mkdir(RESPONSES_DIR, { recursive: true });
    
    try {
      await fs.access(RESPONSES_FILE);
    } catch (error) {
      // File doesn't exist, create it with empty data
      await fs.writeFile(RESPONSES_FILE, JSON.stringify({}));
    }
    
    console.log('Response data store initialized');
  } catch (error) {
    console.error('Error initializing response data store:', error);
  }
};
// Configurar multer para manejar subidas de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Crear el directorio de imágenes si no existe
    const uploadDir = path.join(__dirname, 'public', 'uploads', 'events');
    fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch(err => cb(err));
  },
  filename: (req, file, cb) => {
    // Generar un nombre único para evitar colisiones
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

// Filtro para permitir solo imágenes
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
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  }
});

// Initialize metadata store
const initializeMetadataStore = async () => {
  try {
    await fs.mkdir(RESPONSES_DIR, { recursive: true });
    
    try {
      await fs.access(METADATA_FILE);
    } catch (error) {
      // File doesn't exist, create it with empty data
      await fs.writeFile(METADATA_FILE, JSON.stringify({}));
    }
    
    console.log('Event metadata store initialized');
  } catch (error) {
    console.error('Error initializing event metadata store:', error);
  }
};

// Get responses from storage
const getResponses = async () => {
  try {
    const data = await fs.readFile(RESPONSES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading responses:', error);
    return {};
  }
};

// Save responses to storage
const saveResponses = async (responses) => {
  try {
    await fs.writeFile(RESPONSES_FILE, JSON.stringify(responses, null, 2));
  } catch (error) {
    console.error('Error saving responses:', error);
    throw error;
  }
};

// Get metadata from storage
const getMetadata = async () => {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading metadata:', error);
    return {};
  }
};

// Save metadata to storage
const saveMetadata = async (metadata) => {
  try {
    await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Error saving metadata:', error);
    throw error;
  }
};

// Initialize the data stores
initializeResponsesStore();
initializeMetadataStore();

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
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get all responses for an event
app.get('/api/events/:eventId/responses', async (req, res) => {
  try {
    const { eventId } = req.params;
    const allResponses = await getResponses();
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
    
    const allResponses = await getResponses();
    
    // Initialize array for this event if it doesn't exist
    if (!allResponses[eventId]) {
      allResponses[eventId] = [];
    }
    
    // Check if user has already responded to this event
    const existingResponseIndex = allResponses[eventId].findIndex(r => r.userId === userId);
    
    if (existingResponseIndex >= 0) {
      // Update existing response
      allResponses[eventId][existingResponseIndex] = {
        id: allResponses[eventId][existingResponseIndex].id,
        userId,
        responseType,
        timestamp
      };
    } else {
      // Add new response
      const newResponse = {
        id: `${eventId}_${userId}`,
        userId,
        responseType,
        timestamp
      };
      allResponses[eventId].push(newResponse);
    }
    
    await saveResponses(allResponses);
    
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
    
    const allResponses = await getResponses();
    
    if (!allResponses[eventId]) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Filter out the response from the user
    allResponses[eventId] = allResponses[eventId].filter(r => r.userId !== userId);
    
    await saveResponses(allResponses);
    
    res.json({ success: true, message: 'Response removed' });
  } catch (error) {
    console.error('Error removing response:', error);
    res.status(500).json({ error: 'Failed to remove response' });
  }
});

// Get aggregate statistics for all events
app.get('/api/statistics', async (req, res) => {
  try {
    const allResponses = await getResponses();
    
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
    const allMetadata = await getMetadata();
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
    
    const allMetadata = await getMetadata();
    
    // Update the metadata for this event
    allMetadata[eventId] = {
      ...allMetadata[eventId],
      ...metadata,
      lastUpdated: new Date().toISOString()
    };
    
    await saveMetadata(allMetadata);
    
    res.status(200).json({ success: true, message: 'Metadata updated successfully' });
  } catch (error) {
    console.error('Error updating event metadata:', error);
    res.status(500).json({ error: 'Failed to update event metadata' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Servir archivos estáticos desde public
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Añadir este endpoint para subir imágenes
app.post('/api/events/:eventId/upload-image', upload.single('image'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
    }
    
    // Ruta relativa a la imagen
    const imagePath = `/uploads/events/${req.file.filename}`;
    
    // Actualizar los metadatos del evento con la ruta de la imagen
    const allMetadata = await getMetadata();
    
    // Inicializar el evento si no existe
    if (!allMetadata[eventId]) {
      allMetadata[eventId] = {};
    }
    
    // Añadir o actualizar la imagen
    allMetadata[eventId] = {
      ...allMetadata[eventId],
      imagePath,
      lastUpdated: new Date().toISOString()
    };
    
    await saveMetadata(allMetadata);
    
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