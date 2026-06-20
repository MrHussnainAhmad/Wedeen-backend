import bcrypt from 'bcrypt';
import { Memorization } from '../models/Memorization.js';
import { User } from '../models/User.js';
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

  const existing = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existing) throw badRequest('Email already in use');

  const hashed = await bcrypt.hash(password, env.bcryptRounds);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password: hashed,
    unlockedSurah: 1
  });

  const token = signToken({ id: user._id.toString() });

  await sendEmailSafe({
    to: user.email,
    subject: 'Welcome to WeDeen',
    text: `Assalamualaikum ${user.name}, your WeDeen account has been created successfully.`
  }, 'register');

  res.status(201).json({
    token,
    user: publicUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

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
  const user = await User.findById(req.user.id).select('-password').lean();
  if (!user) throw unauthorized('User not found');
  res.json({ user });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw notFound('User not found');

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw unauthorized('Current password is incorrect');

  user.password = await bcrypt.hash(newPassword, env.bcryptRounds);
  await user.save();

  await sendEmailSafe({
    to: user.email,
    subject: 'WeDeen password updated',
    text: 'Your WeDeen password was updated successfully.'
  }, 'updatePassword');

  res.json({ success: true });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw notFound('User not found');

  const email = user.email;
  await Memorization.deleteMany({ userId: user._id });
  await User.deleteOne({ _id: user._id });

  await sendEmailSafe({
    to: email,
    subject: 'WeDeen account deleted',
    text: 'Your WeDeen account has been deleted.'
  }, 'deleteAccount');

  res.json({ success: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
  }

  const token = signPasswordResetToken({ id: user._id.toString(), email: user.email });
  const appUrl = process.env.APP_RESET_PASSWORD_URL || 'wedeen://reset-password';
  const link = `${appUrl}${appUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;

  await sendEmailSafe({
    to: user.email,
    subject: 'Reset your WeDeen password',
    text: `Use this link to reset your WeDeen password:\n${link}\n\nThis link expires in 30 minutes.`
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

  const user = await User.findById(decoded.id);
  if (!user || user.email !== decoded.email) throw badRequest('Invalid reset token');

  user.password = await bcrypt.hash(newPassword, env.bcryptRounds);
  await user.save();

  await sendEmailSafe({
    to: user.email,
    subject: 'WeDeen password reset successful',
    text: 'Your WeDeen password has been reset successfully.'
  }, 'resetPassword');

  res.json({ success: true });
});
