import mongoose from 'mongoose';

const envMongoUri = process.env.MONGODB_URI;

if (!envMongoUri) {
  throw new Error('Missing MONGODB_URI');
}

const MONGODB_URI: string = envMongoUri;

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as {
  mongoose?: Cached;
};

const cached: Cached =
  globalForMongoose.mongoose ?? {
    conn: null,
    promise: null,
  };

globalForMongoose.mongoose = cached;

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(
      MONGODB_URI,
      {
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      }
    );
  }

  cached.conn = await cached.promise;

  return cached.conn;
}