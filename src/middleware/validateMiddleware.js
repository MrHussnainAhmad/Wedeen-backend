import { badRequest } from '../utils/errors.js';
import mongoose from 'mongoose';
import { getSurahAyahCount } from '../constants/quran.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bodyOf(req) {
  return req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
}

function isValidDate(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

export function validateRegister(req, _res, next) {
  const { name, email, password, confirmPassword } = bodyOf(req);
  if (typeof name !== 'string' || name.trim().length < 2) return next(badRequest('Name must be at least 2 characters'));
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) return next(badRequest('Valid email is required'));
  if (typeof password !== 'string' || password.length < 6) return next(badRequest('Password must be at least 6 characters'));
  if (confirmPassword !== undefined && password !== confirmPassword) return next(badRequest('Passwords do not match'));
  next();
}

export function validateLogin(req, _res, next) {
  const { email, password } = bodyOf(req);
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) return next(badRequest('Valid email is required'));
  if (typeof password !== 'string' || password.length < 6) return next(badRequest('Password must be at least 6 characters'));
  next();
}

export function validateMarkMemorization(req, _res, next) {
  const { surahNumber, ayahNumber, memorized, nextReview } = bodyOf(req);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return next(badRequest('surahNumber must be an integer between 1 and 114'));
  }
  const maxAyah = getSurahAyahCount(surahNumber);
  if (!Number.isInteger(ayahNumber) || ayahNumber < 1 || ayahNumber > maxAyah) {
    return next(badRequest(`ayahNumber must be an integer between 1 and ${maxAyah}`));
  }
  if (typeof memorized !== 'boolean') {
    return next(badRequest('memorized must be boolean'));
  }
  if (nextReview != null && !isValidDate(nextReview)) {
    return next(badRequest('nextReview must be a valid date'));
  }
  next();
}

export function validateUnlockSurah(req, _res, next) {
  const { surahNumber } = bodyOf(req);
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
    return next(badRequest('surahNumber must be an integer between 1 and 114'));
  }
  next();
}

export function validatePasswordUpdate(req, _res, next) {
  const { currentPassword, newPassword, confirmPassword } = bodyOf(req);
  if (typeof currentPassword !== 'string' || currentPassword.length < 6) return next(badRequest('Current password is required'));
  if (typeof newPassword !== 'string' || newPassword.length < 6) return next(badRequest('New password must be at least 6 characters'));
  if (newPassword !== confirmPassword) return next(badRequest('Passwords do not match'));
  next();
}

export function validateForgotPassword(req, _res, next) {
  const { email } = bodyOf(req);
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) return next(badRequest('Valid email is required'));
  next();
}

export function validateResetPassword(req, _res, next) {
  const { token, newPassword, confirmPassword } = bodyOf(req);
  if (typeof token !== 'string' || !token) return next(badRequest('Reset token is required'));
  if (typeof newPassword !== 'string' || newPassword.length < 6) return next(badRequest('New password must be at least 6 characters'));
  if (newPassword !== confirmPassword) return next(badRequest('Passwords do not match'));
  next();
}

export function validateUpdateMemorization(req, _res, next) {
  const { id, memorized, lastReviewed, nextReview } = bodyOf(req);
  if (!mongoose.isValidObjectId(id)) return next(badRequest('Valid id is required'));
  if (memorized !== undefined && typeof memorized !== 'boolean') {
    return next(badRequest('memorized must be boolean'));
  }
  if (lastReviewed != null && !isValidDate(lastReviewed)) {
    return next(badRequest('lastReviewed must be a valid date'));
  }
  if (nextReview != null && !isValidDate(nextReview)) {
    return next(badRequest('nextReview must be a valid date'));
  }
  next();
}

export function validateMemorizationId(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(badRequest('Valid memorization id is required'));
  }
  next();
}
