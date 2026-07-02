import bcrypt from 'bcrypt';
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
import { env } from '../config/env.js';
import { sendEmail } from '../services/mailService.js';
import { signPasswordResetToken, signToken, verifyPasswordResetToken } from '../services/tokenService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, notFound, unauthorized } from '../utils/errors.js';

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    unlockedSurah: user.unlockedSurah ?? 1,
    createdAt: user.createdAt
  };
}

async function sendEmailSafe(payload, context) {
  try {
    await sendEmail(payload);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[mail:${context}] ${reason}`);
  }
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) throw badRequest('Email already in use');

  const hashed = await bcrypt.hash(password, env.bcryptRounds);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashed,
    unlockedSurah: 1
  });

  const token = signToken({ id: user._id.toString() });

  await sendEmailSafe({
    to: user.email,
    subject: 'Welcome to Muslim Deen: Quran & Prayer',
    text: `Assalamualaikum ${user.name}, your Muslim Deen: Quran & Prayer account has been created successfully.`
  }, 'register');

  res.status(201).json({
    token,
    user: publicUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) throw unauthorized('Invalid credentials');
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw unauthorized('Invalid credentials');

  const token = signToken({ id: user._id.toString() });

  res.json({
    token,
    user: publicUser(user)
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -passwordResetVersion');
  if (!user) throw unauthorized('User not found');
  res.json({ user: publicUser(user) });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw notFound('User not found');

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw unauthorized('Current password is incorrect');

  user.password = await bcrypt.hash(newPassword, env.bcryptRounds);
  user.passwordResetVersion = (user.passwordResetVersion ?? 0) + 1;
  await user.save();

  await sendEmailSafe({
    to: user.email,
    subject: 'Muslim Deen: Quran & Prayer password updated',
    text: 'Your Muslim Deen: Quran & Prayer password was updated successfully.'
  }, 'updatePassword');

  res.json({ success: true });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw notFound('User not found');

  const email = user.email;
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

  await sendEmailSafe({
    to: email,
    subject: 'Muslim Deen: Quran & Prayer account deleted',
    text: 'Your Muslim Deen: Quran & Prayer account has been deleted.'
  }, 'deleteAccount');

  res.json({ success: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
  }

  const token = signPasswordResetToken({
    id: user._id.toString(),
    email: user.email,
    passwordResetVersion: user.passwordResetVersion ?? 0
  });
  const appUrl = process.env.APP_RESET_PASSWORD_URL || 'wedeen://reset-password';
  const link = `${appUrl}${appUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;

  await sendEmailSafe({
    to: user.email,
    subject: 'Reset your Muslim Deen: Quran & Prayer password',
    text: `Use this link to reset your Muslim Deen: Quran & Prayer password:\n${link}\n\nThis link expires in 30 minutes.`
  }, 'forgotPassword');

  return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  let decoded;
  try {
    decoded = verifyPasswordResetToken(token);
  } catch {
    throw badRequest('Invalid or expired reset token');
  }

  if (!Number.isInteger(decoded.passwordResetVersion)) {
    throw badRequest('Invalid reset token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, env.bcryptRounds);
  const resetVersionCondition =
    decoded.passwordResetVersion === 0
      ? { $or: [{ passwordResetVersion: 0 }, { passwordResetVersion: { $exists: false } }] }
      : { passwordResetVersion: decoded.passwordResetVersion };
  const user = await User.findOneAndUpdate(
    {
      _id: decoded.id,
      email: decoded.email,
      ...resetVersionCondition
    },
    {
      $set: { password: hashedPassword },
      $inc: { passwordResetVersion: 1 }
    },
    { new: true }
  );
  if (!user) throw badRequest('Invalid or already used reset token');

  await sendEmailSafe({
    to: user.email,
    subject: 'Muslim Deen: Quran & Prayer password reset successful',
    text: 'Your Muslim Deen: Quran & Prayer password has been reset successfully.'
  }, 'resetPassword');

  res.json({ success: true });
});
