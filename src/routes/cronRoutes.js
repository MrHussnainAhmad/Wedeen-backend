import express from 'express';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

function requireCronSecret(req, res, next) {
  if (!env.cronSecret || req.get('authorization') !== `Bearer ${env.cronSecret}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  return next();
}

router.get(
  '/mongodb-ping',
  requireCronSecret,
  asyncHandler(async (_req, res) => {
    const result = await mongoose.connection.db.command({ ping: 1 });

    res.json({
      success: result.ok === 1,
      pingedAt: new Date().toISOString()
    });
  })
);

export default router;
