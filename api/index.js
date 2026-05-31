import { connectDB } from '../src/config/db.js';
import app from '../src/server.js';

let dbReadyPromise;

export default async function handler(req, res) {
  // Restore original API pathname passed by Vercel rewrite so Express can match routes.
  const url = new URL(req.url, 'http://localhost');
  const rewrittenPathname = url.searchParams.get('__pathname');
  if (rewrittenPathname) {
    url.searchParams.delete('__pathname');
    const search = url.searchParams.toString();
    req.url = search ? `${rewrittenPathname}?${search}` : rewrittenPathname;
  }

  if (!dbReadyPromise) {
    dbReadyPromise = connectDB().catch((error) => {
      dbReadyPromise = null;
      throw error;
    });
  }

  await dbReadyPromise;
  return app(req, res);
}
