// migrate-data.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RESPONSES_FILE = path.join(__dirname, 'data', 'event_responses.json');
const METADATA_FILE = path.join(__dirname, 'data', 'event_metadata.json');

const migrateResponses = async () => {
  try {
    console.log('Migrating event responses...');
    
    // Read the JSON file
    const responseData = JSON.parse(await fs.readFile(RESPONSES_FILE, 'utf-8'));
    
    // Migrate each response
    let totalResponses = 0;
    
    for (const [eventId, responses] of Object.entries(responseData)) {
      for (const response of responses) {
        await db.saveEventResponse(
          eventId,
          response.userId,
          response.responseType,
          response.timestamp
        );
        totalResponses++;
      }
    }
    
    console.log(`Successfully migrated ${totalResponses} event responses.`);
  } catch (error) {
    console.error('Error migrating responses:', error);
  }
};

const migrateMetadata = async () => {
  try {
    console.log('Migrating event metadata...');
    
    // Read the JSON file
    const metadataData = JSON.parse(await fs.readFile(METADATA_FILE, 'utf-8'));
    
    // Migrate each metadata entry
    let totalEntries = 0;
    
    for (const [eventId, metadata] of Object.entries(metadataData)) {
      await db.saveEventMetadata(eventId, {
        imagePath: metadata.imagePath,
        imageCategory: metadata.imageCategory,
        additionalInfo: metadata.additionalInfo,
      });
      totalEntries++;
    }
    
    console.log(`Successfully migrated ${totalEntries} metadata entries.`);
  } catch (error) {
    console.error('Error migrating metadata:', error);
  }
};

const runMigration = async () => {
  try {
    // Initialize the database
    await db.initDatabase();
    
    // Migrate data
    await migrateResponses();
    await migrateMetadata();
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();