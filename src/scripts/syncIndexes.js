import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Memorization } from '../models/Memorization.js';
import { Reflection } from '../models/Reflection.js';

// One-time run after schema/index changes. Production disables autoIndex, so
// run this against the production DB when adding or changing indexes.
async function run() {
  await connectDB();
  console.log('[sync-indexes] building User indexes...');
  await User.syncIndexes();
  console.log('[sync-indexes] building Memorization indexes...');
  await Memorization.syncIndexes();
  console.log('[sync-indexes] building Reflection indexes...');
  await Reflection.syncIndexes();
  console.log('[sync-indexes] done.');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((error) => {
  console.error('[sync-indexes] failed', error);
  process.exit(1);
});
