import mongoose from 'mongoose';
import dns from 'node:dns';
import env from './env.js';

// Node's c-ares resolver can fail SRV lookups (mongodb+srv://) on some networks
// even when the OS resolves fine. Force reliable public DNS servers.
dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);

// Cache the connection across invocations. On Vercel the serverless process is
// reused between requests, so without this we'd open a new connection per call
// (and quickly exhaust Atlas's connection limit). The cache lives on `global`
// so it survives module re-evaluation within the same warm container.
let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    // bufferCommands:false → fail fast instead of queueing queries before the
    // connection is ready (important during serverless cold starts).
    cached.promise = mongoose.connect(env.mongoUri, { bufferCommands: false }).then((conn) => {
      console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow a retry on the next request
    console.error('❌ MongoDB connection error:', err.message);
    throw err; // never process.exit() in serverless — it kills the whole function
  }
  return cached.conn;
}
