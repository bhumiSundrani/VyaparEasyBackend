import mongoose from "mongoose";
import { env } from "../config/env";

const { MONGODB_URI } = env;

type MongooseGlobal = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongoose: MongooseGlobal | undefined;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  _mongoose?: MongooseGlobal;
};

if (!globalWithMongoose._mongoose) {
  globalWithMongoose._mongoose = {
    conn: null,
    promise: null,
  };
}

async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI not configured");
  }

  const cached = globalWithMongoose._mongoose!;

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB connected");
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default dbConnect;
