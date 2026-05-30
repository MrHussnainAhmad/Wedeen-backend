import { env } from '../config/env.js';

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  if (env.nodeEnv !== 'production') {
    console.error(err);
  }
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    details: err.details || null
  });
}
