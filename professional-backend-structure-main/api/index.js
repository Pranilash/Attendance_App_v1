import mongoose from 'mongoose';
import { app } from '../src/app-attendance.js';

// In Vercel serverless, we need to connect to MongoDB before handling requests.
// We cache the connection so it doesn't reconnect on every invocation.
let cached = global.mongoose || { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => {
      console.log('MongoDB Connected! Host: ' + mongooseInstance.connection.host);
      return mongooseInstance;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Connect before each request (uses cached connection after first call)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
});

export default app;
