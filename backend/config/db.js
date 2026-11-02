import mongoose from 'mongoose';

/**
 * Utility to mask database credentials in log output
 */
const maskDbUri = (uri) => {
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
};

/**
 * Connect to MongoDB instance using MONGODB_URI or MONGO_URI environment variables.
 * Fallback to 127.0.0.1 if localhost has IPv6 resolution hiccups on Windows.
 */
export const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/sarkarisetu';

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.error('[Database Error] Invalid MongoDB URI format: Scheme must start with mongodb:// or mongodb+srv://');
    process.exit(1);
  }

  const safeLoggedUri = maskDbUri(uri);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[Database] Initial connection with "${safeLoggedUri}" failed: ${error.message}`);
    // If localhost failed (common on Windows node with IPv6 ::1 vs IPv4 127.0.0.1), try 127.0.0.1
    if (uri.includes('localhost')) {
      const fallbackUri = uri.replace('localhost', '127.0.0.1');
      console.log(`[Database] Retrying connection with IPv4 fallback...`);
      try {
        const conn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[Database] MongoDB Connected successfully via fallback: ${conn.connection.host}/${conn.connection.name}`);
        return;
      } catch (fallbackError) {
        console.error(`[Database] Fallback connection failed: ${fallbackError.message}`);
      }
    }
    console.error(`[Database Error] Could not connect to MongoDB. Ensure MongoDB service is running.`);
    process.exit(1);
  }
};

export default connectDB;
