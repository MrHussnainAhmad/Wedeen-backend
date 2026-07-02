import crypto from 'crypto';
import mongoose from 'mongoose';
import { Achievement } from '../../src/models/Achievement.js';
import { DuaProgress } from '../../src/models/DuaProgress.js';
import { FastingLog } from '../../src/models/FastingLog.js';
import { Favorite } from '../../src/models/Favorite.js';
import { User } from '../../src/models/User.js';
import { Memorization } from '../../src/models/Memorization.js';
import { PlaceFavorite } from '../../src/models/PlaceFavorite.js';
import { Reflection } from '../../src/models/Reflection.js';
import { SalahLog } from '../../src/models/SalahLog.js';
import { Tasbih } from '../../src/models/Tasbih.js';
import { ZakatCalculation } from '../../src/models/ZakatCalculation.js';

let dbReadyPromise;

async function ensureDbConnected() {
  if (!dbReadyPromise) {
    dbReadyPromise = mongoose.connect(process.env.MONGO_URI, { autoIndex: true }).catch((error) => {
      dbReadyPromise = null;
      throw error;
    });
  }
  await dbReadyPromise;
}

function safeRequestId(value) {
  return typeof value === 'string' ? value : null;
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function isValidPayload(email, requestId) {
  if (typeof email !== 'string' || typeof requestId !== 'string') return false;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !requestId.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalizedEmail);
}

function isAuthorized(serviceToken) {
  const expectedToken = process.env.ACCOUNT_DELETION_SERVICE_TOKEN;
  if (!expectedToken || typeof serviceToken !== 'string') return false;
  const provided = Buffer.from(serviceToken, 'utf8');
  const expected = Buffer.from(expectedToken, 'utf8');
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(provided, expected);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      status: 'failed',
      message: 'Method Not Allowed',
      requestId: null
    });
  }

  const body = parseBody(req);
  const requestId = safeRequestId(body.requestId);
  const serviceToken = req.headers['x-service-token'];

  if (!isAuthorized(serviceToken)) {
    return res.status(401).json({
      success: false,
      status: 'failed',
      message: 'Unauthorized',
      requestId
    });
  }

  const { email } = body;
  if (!isValidPayload(email, requestId)) {
    return res.status(400).json({
      success: false,
      status: 'failed',
      message: 'Invalid payload',
      requestId
    });
  }

  await ensureDbConnected();

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
}
