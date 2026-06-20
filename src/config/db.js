import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

// Cache the connection across warm serverless invocations. On Vercel the module
// scope is reused while a container stays warm, and `global` survives across
// route modules — so we only ever open one pool per instance instead of one per
// request. This is the key to surviving thousands of concurrent invocations
// without exhausting MongoDB Atlas connection limits.
let cached = global.__wedeenMongoose;
if (!cached) {
  cached = global.__wedeenMongoose = { conn: null, promise: null };
}

let listenersBound = false;
function bindConnectionListeners() {
  if (listenersBound) return;
  listenersBound = true;
  mongoose.connection.on('error', (error) => {
    console.error('[db] connection error', error?.message ?? error);
  });
  mongoose.connection.on('disconnected', () => {
    // Drop the cache so the next request re-establishes the pool.
    cached.conn = null;
    cached.promise = null;
  });
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    bindConnectionListeners();
    cached.promise = mongoose
      .connect(env.mongoUri, {
        // Keep each serverless instance's pool small. Node is single-threaded,
        // so a handful of sockets per instance is plenty; many instances * a
        // large pool would overwhelm Atlas.
        maxPoolSize: env.dbMaxPoolSize,
        minPoolSize: 0,
        maxIdleTimeMS: 60_000,
        // Fail fast instead of hanging the function (and burning billed time)
        // when the DB is unreachable or saturated.
        serverSelectionTimeoutMS: 8_000,
        socketTimeoutMS: 45_000,
        // Don't issue createIndex on every cold start in production; run the
        // one-time `npm run sync-indexes` after a schema/index change instead.
        autoIndex: env.nodeEnv !== 'production',
      })
      .then((m) => m)
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
