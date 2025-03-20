// s3Storage.js
<<<<<<< HEAD
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client with retry configuration
=======
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
>>>>>>> 28408cf9c058d9ae0b7cac6cf8c8d37521ca8064
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
<<<<<<< HEAD
  },
  maxAttempts: 3, // Add retry capability
=======
  }
>>>>>>> 28408cf9c058d9ae0b7cac6cf8c8d37521ca8064
});

// S3 bucket name
const bucketName = process.env.S3_BUCKET_NAME;

// Upload a file to S3
export const uploadFile = async (file) => {
<<<<<<< HEAD
  if (!file || !file.buffer) {
    throw new Error('Invalid file');
  }

  // Create a unique file name
  const uniqueFilename = `${uuidv4()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '')}`;
  const key = `events/${uniqueFilename}`;
  
  // Set up the S3 upload parameters
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // Add caching headers to improve performance
    CacheControl: 'max-age=31536000'
  };

  try {
    // Upload to S3
    const command = new PutObjectCommand(params);
    await s3.send(command);
    
    // Verify the upload was successful
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    await s3.send(headCommand);
    
    // Return the URL of the uploaded file
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

// Check if a file exists in S3
export const checkFileExists = async (fileUrl) => {
  try {
    // Extract the key from the URL
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(urlParts.indexOf('events')).join('/');
    
    const params = {
      Bucket: bucketName,
      Key: key
    };

    await s3.send(new HeadObjectCommand(params));
    return true;
  } catch (error) {
    return false;
=======
  try {
    if (!file || !file.buffer) {
      throw new Error('Invalid file');
    }

    // Create a unique file name
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    
    // Set up the S3 upload parameters - SIN ACL
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
>>>>>>> 28408cf9c058d9ae0b7cac6cf8c8d37521ca8064
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
<<<<<<< HEAD
=======
    
>>>>>>> 28408cf9c058d9ae0b7cac6cf8c8d37521ca8064
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};