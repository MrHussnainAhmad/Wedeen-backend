import { connectDB } from '../src/config/db.js';
import app from '../src/server.js';

let dbReadyPromise;

export default async function handler(req, res) {
  if (!dbReadyPromise) {
    dbReadyPromise = connectDB().catch((error) => {
      dbReadyPromise = null;
      throw error;
    });
  }

  await dbReadyPromise;
  return app(req, res);
}
