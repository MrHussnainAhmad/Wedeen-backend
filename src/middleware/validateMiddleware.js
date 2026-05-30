import { badRequest } from '../utils/errors.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req, _res, next) {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || name.trim().length < 2) return next(badRequest('Name must be at least 2 characters'));
  if (!email || !EMAIL_REGEX.test(email)) return next(badRequest('Valid email is required'));
  if (!password || password.length < 6) return next(badRequest('Password must be at least 6 characters'));
  if (confirmPassword !== undefined && password !== confirmPassword) return next(badRequest('Passwords do not match'));
  next();
}

export function validateLogin(req, _res, next) {
  const { email, password } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) return next(badRequest('Valid email is required'));
  if (!password || password.length < 6) return next(badRequest('Password must be at least 6 characters'));
  next();
}

export function validateMarkMemorization(req, _res, next) {
  const { surahNumber, ayahNumber, memorized } = req.body;
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return next(badRequest('surahNumber must be an integer between 1 and 114'));
  }
  if (!Number.isInteger(ayahNumber) || ayahNumber < 1) {
    return next(badRequest('ayahNumber must be a positive integer'));
  }
  if (typeof memorized !== 'boolean') {
    return next(badRequest('memorized must be boolean'));
  }
  next();
}

export function validateUnlockSurah(req, _res, next) {
  const { surahNumber } = req.body;
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return next(badRequest('surahNumber must be an integer between 1 and 114'));
  }
  next();
}

export function validatePasswordUpdate(req, _res, next) {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || currentPassword.length < 6) return next(badRequest('Current password is required'));
  if (!newPassword || newPassword.length < 6) return next(badRequest('New password must be at least 6 characters'));
  if (newPassword !== confirmPassword) return next(badRequest('Passwords do not match'));
  next();
}

export function validateForgotPassword(req, _res, next) {
  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) return next(badRequest('Valid email is required'));
  next();
}

export function validateResetPassword(req, _res, next) {
  const { token, newPassword, confirmPassword } = req.body;
  if (!token) return next(badRequest('Reset token is required'));
  if (!newPassword || newPassword.length < 6) return next(badRequest('New password must be at least 6 characters'));
  if (newPassword !== confirmPassword) return next(badRequest('Passwords do not match'));
  next();
}
