import crypto from 'crypto';
import { Achievement } from '../models/Achievement.js';
import { DuaProgress } from '../models/DuaProgress.js';
import { FastingLog } from '../models/FastingLog.js';
import { Favorite } from '../models/Favorite.js';
import { Memorization } from '../models/Memorization.js';
import { PlaceFavorite } from '../models/PlaceFavorite.js';
import { Reflection } from '../models/Reflection.js';
import { SalahLog } from '../models/SalahLog.js';
import { Tasbih } from '../models/Tasbih.js';
import { User } from '../models/User.js';
import { ZakatCalculation } from '../models/ZakatCalculation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

function safeRequestId(value) {
  return typeof value === 'string' ? value : '';
}

function isValidPayload(email, requestId) {
  if (typeof email !== 'string' || typeof requestId !== 'string') return false;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !requestId.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalizedEmail);
}

function isAuthorized(serviceToken) {
  const expectedToken = env.accountDeletionServiceToken;
  if (!expectedToken || typeof serviceToken !== 'string') return false;
  const provided = Buffer.from(serviceToken, 'utf8');
  const expected = Buffer.from(expectedToken, 'utf8');
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

export const deleteAccountCompliance = asyncHandler(async (req, res) => {
  const requestId = safeRequestId(req.body?.requestId);
  const serviceToken = req.headers['x-service-token'];

  if (!isAuthorized(serviceToken)) {
    return res.status(401).json({
      success: false,
      status: 'failed',
      message: 'Unauthorized',
      requestId
    });
  }

  const { email } = req.body ?? {};
  if (!isValidPayload(email, requestId)) {
    return res.status(400).json({
      success: false,
      status: 'failed',
      message: 'Invalid payload',
      requestId
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('_id').lean();

  if (user?._id) {
    await Promise.all([
      Memorization.deleteMany({ userId: user._id }),
      SalahLog.deleteMany({ userId: user._id }),
      Tasbih.deleteMany({ userId: user._id }),
      Achievement.deleteMany({ userId: user._id }),
      Favorite.deleteMany({ userId: user._id }),
      ZakatCalculation.deleteMany({ userId: user._id }),
      FastingLog.deleteMany({ userId: user._id }),
      PlaceFavorite.deleteMany({ userId: user._id }),
      DuaProgress.deleteMany({ userId: user._id }),
      Reflection.deleteMany({ userId: user._id }),
    ]);
    await User.deleteOne({ _id: user._id });
  }

  return res.status(200).json({
    success: true,
    status: 'completed',
    message: 'Deletion request processed',
    requestId
  });
});
