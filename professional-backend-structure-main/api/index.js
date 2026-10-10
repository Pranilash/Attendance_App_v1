import mongoose from 'mongoose';
import { app } from '../src/app-attendance.js';

// Cache database connection across serverless invocations
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is missing in Vercel project settings');
    }

    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // Prevents 10s buffering timeouts when disconnected
      serverSelectionTimeoutMS: 5000,
    }).then((mongooseInstance) => {
      console.log('MongoDB Connected! Host: ' + mongooseInstance.connection.host);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // Reset so next invocation can retry
    throw err;
  }

  return cached.conn;
}

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (error) {
    console.error('Serverless MongoDB connection error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed: ' + error.message,
    });
  }

  return app(req, res);
}
