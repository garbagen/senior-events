// s3Storage.js
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

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
    if (!file) {
      throw new Error('Invalid file');
    }

    // Create a unique file name
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    
    // Ensure we have a buffer
    let fileBuffer = file.buffer;
    if (!fileBuffer && file.path) {
      try {
        fileBuffer = await fs.readFile(file.path);
      } catch (readError) {
        throw new Error(`Could not read file: ${readError.message}`);
      }
    }
    
    if (!fileBuffer) {
      throw new Error('No file content available');
    }
    
    // Set up the S3 upload parameters
    const params = {
      Bucket: bucketName,
      Key: `events/${uniqueFilename}`,
      Body: fileBuffer,
      ContentType: file.mimetype,
      ACL: 'public-read'  // Make the file publicly accessible
    };

    // Upload to S3
    await s3.send(new PutObjectCommand(params));
    
    // Return the URL of the uploaded file
    return `https://${bucketName}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/events/${uniqueFilename}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

// Delete a file from S3
export const deleteFile = async (fileUrl) => {
  try {
    // Extract the key from the URL
    // Check if the URL is from S3
    if (!fileUrl.includes('s3.') || !fileUrl.includes(bucketName)) {
      console.warn('Not an S3 URL, skipping deletion:', fileUrl);
      return true;
    }
    
    // Extract the key - the part after the bucket name in the URL
    const urlParts = fileUrl.split(`${bucketName}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid S3 URL format');
    }
    
    const key = urlParts[1];
    
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