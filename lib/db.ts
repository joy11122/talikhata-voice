import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('Missing MONGODB_URI');

type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = globalThis as unknown as { mongoose: Cached | undefined };
const cached: Cached = globalForMongoose.mongoose ?? { conn: null, promise: null };
if (!globalForMongoose.mongoose) globalForMongoose.mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
