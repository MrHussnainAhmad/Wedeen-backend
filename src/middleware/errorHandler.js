import { env } from '../config/env.js';

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  if (err?.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier or value';
  } else if (err?.code === 11000) {
    statusCode = 409;
    message = 'A record with this value already exists';
  }
  if (env.nodeEnv !== 'production') {
    console.error(err);
  }
  res.status(statusCode).json({
    message,
    details: err.details || null
  });
}
