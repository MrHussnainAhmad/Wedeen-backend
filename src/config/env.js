import dotenv from 'dotenv';

dotenv.config();

const required = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  accountDeletionServiceToken: process.env.ACCOUNT_DELETION_SERVICE_TOKEN || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
  // Per-instance Mongo pool size. Keep small for serverless; raise for a single
  // long-lived server. maxPoolSize * expected concurrent instances must stay
  // under your Atlas tier's connection limit.
  dbMaxPoolSize: Number(process.env.DB_MAX_POOL_SIZE) || 10,
  // bcrypt work factor. 10 (~60ms/op) balances security and login throughput;
  // 12 (~250ms/op) is ~4x more CPU per login. Existing hashes keep working.
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10
};
