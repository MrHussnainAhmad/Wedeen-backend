import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import memorizationRoutes from './routes/memorizationRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Behind Vercel's edge/proxy. Trust the first hop so express-rate-limit keys on
// the real client IP (X-Forwarded-For) instead of the proxy IP — otherwise a
// single shared limit would trip for ALL users at once under load.
app.set('trust proxy', 1);

app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// NOTE: this uses the default in-memory store, so limits are per serverless
// instance, not global. That's fine as per-instance abuse protection. For a
// strict global limit across instances, back it with a shared store (e.g.
// rate-limit-redis / Upstash).
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // generous: a normal app session polls progress/data frequently
  standardHeaders: true,
  legacyHeaders: false
});

// Tighter limit on credential endpoints to blunt brute-force / signup spam.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // only failed attempts count toward the limit
});

app.get('/', (_req, res) => res.send('SERVER IS RUNNING!'));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/memorization', memorizationRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/sync', syncRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

export async function bootstrap() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

if (process.env.VERCEL !== '1') {
  bootstrap().catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
}

export default app;
