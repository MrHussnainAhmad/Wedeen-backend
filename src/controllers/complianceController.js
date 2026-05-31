import crypto from 'crypto';
import { Memorization } from '../models/Memorization.js';
import { User } from '../models/User.js';
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
    await Memorization.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
  }

  return res.status(200).json({
    success: true,
    status: 'completed',
    message: 'Deletion request processed',
    requestId
  });
});
