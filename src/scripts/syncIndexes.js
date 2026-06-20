import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Memorization } from '../models/Memorization.js';

// One-time (run after any index/schema change). Because autoIndex is disabled in
// production, indexes are not built on cold start — run `npm run sync-indexes`
// against the production DB to create/update them safely in the background.
async function run() {
  await connectDB();
  console.log('[sync-indexes] building User indexes…');
  await User.syncIndexes();
  console.log('[sync-indexes] building Memorization indexes…');
  await Memorization.syncIndexes();
  console.log('[sync-indexes] done.');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((error) => {
  console.error('[sync-indexes] failed', error);
  process.exit(1);
});
