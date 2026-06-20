import { connectDB } from '../src/config/db.js';
import app from '../src/server.js';

export default async function handler(req, res) {
  // Restore original API pathname passed by Vercel rewrite so Express can match routes.
  const url = new URL(req.url, 'http://localhost');
  const rewrittenPathname = url.searchParams.get('__pathname');
  if (rewrittenPathname) {
    url.searchParams.delete('__pathname');
    const search = url.searchParams.toString();
    req.url = search ? `${rewrittenPathname}?${search}` : rewrittenPathname;
  }

  // connectDB caches the connection across warm invocations (see config/db.js),
  // so this is a no-op once the pool is established.
  try {
    await connectDB();
  } catch (error) {
    console.error('[api] database unavailable', error?.message ?? error);
    return res.status(503).json({ message: 'Service temporarily unavailable' });
  }

  return app(req, res);
}
