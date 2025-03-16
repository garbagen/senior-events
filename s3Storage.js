// s3Storage.js
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// S3 bucket name
const bucketName = process.env.S3_BUCKET_NAME;

// Upload a file to S3
export const uploadFile = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('Invalid file');
    }

    // Create a unique file name
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    
    // Set up the S3 upload parameters
    const params = {
      Bucket: bucketName,
      Key: `events/${uniqueFilename}`,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    // Upload to S3
    await s3.send(new PutObjectCommand(params));
    
    // Return the URL of the uploaded file
    return `https://${bucketName}.s3.amazonaws.com/events/${uniqueFilename}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

// Delete a file from S3
export const deleteFile = async (fileUrl) => {
  try {
    // Extract the key from the URL
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(urlParts.indexOf('events')).join('/');
    
    const params = {
      Bucket: bucketName,
      Key: key
    };

    await s3.send(new DeleteObjectCommand(params));
    
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};