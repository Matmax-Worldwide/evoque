import { NextRequest, NextResponse } from 'next/server';
import { 
  S3Client, 
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';

// Create S3 client (server-side only)
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY || '',
  }
});

// S3 bucket name
const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'vercelvendure';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle both single file and batch operations
    if (body.keys && Array.isArray(body.keys)) {
      // Bulk delete operation
      const { keys } = body;
      
      console.log(`DELETE request received for ${keys.length} S3 keys`);
      console.log(`Using bucket: ${bucketName}`);
      
      if (!keys.length) {
        console.log('ERROR: No keys provided in request');
        return NextResponse.json(
          { error: 'No keys provided' }, 
          { status: 400 }
        );
      }
      
      const results = [];
      const errors = [];
      
      // Process each key
      for (const key of keys) {
        try {
          // Check if the object exists
          const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
          });
          
          try {
            await s3Client.send(headCommand);
            console.log(`Object with key ${key} exists, proceeding with deletion`);
          } catch (headError) {
            console.error(`Object ${key} does not exist or cannot be accessed:`, headError);
            errors.push({ key, error: 'Object does not exist or cannot be accessed' });
            continue;
          }
          
          // Create delete command
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          });
          
          // Execute delete
          console.log(`Sending delete command to S3 for key ${key}`);
          await s3Client.send(deleteCommand);
          console.log(`Delete command executed successfully for key ${key}`);
          
          results.push({ key, success: true });
        } catch (error) {
          console.error(`Error deleting file ${key}:`, error);
          errors.push({ key, error: 'Failed to delete file' });
        }
      }
      
      return NextResponse.json({
        success: true,
        results,
        errors,
        totalDeleted: results.length,
        totalErrors: errors.length
      });
    } else {
      // Single file delete operation
      const { key } = body;
      
      console.log(`DELETE request received for S3 key: ${key}`);
      console.log(`Using bucket: ${bucketName}`);
      
      if (!key) {
        console.log('ERROR: No key provided in request');
        return NextResponse.json(
          { error: 'No key provided' }, 
          { status: 400 }
        );
      }

      try {
        // First check if the object exists
        const headCommand = new HeadObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        
        try {
          await s3Client.send(headCommand);
          console.log(`Object with key ${key} exists, proceeding with deletion`);
        } catch (headError) {
          console.error('Object does not exist or cannot be accessed:', headError);
          return NextResponse.json(
            { error: 'Object does not exist or cannot be accessed' },
            { status: 404 }
          );
        }
        
        // Create delete command
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        
        // Execute delete
        console.log('Sending delete command to S3');
        await s3Client.send(deleteCommand);
        console.log('Delete command executed successfully');
        
        return NextResponse.json({
          success: true,
          message: 'File deleted successfully'
        });
      } catch (error) {
        console.error('S3 operation error:', error);
        throw error; // Rethrow to be caught by outer try/catch
      }
    }
  } catch (error) {
    console.error('Error processing delete request:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 