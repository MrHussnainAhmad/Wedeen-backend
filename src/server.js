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
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/', (_req, res) => res.send('SERVER IS RUNNING!'));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/memorization', memorizationRoutes);
app.use('/api/compliance', complianceRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

async function bootstrap() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
