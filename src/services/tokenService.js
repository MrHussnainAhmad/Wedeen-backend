import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '30d' });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function signPasswordResetToken(payload) {
  return jwt.sign({ ...payload, purpose: 'password_reset' }, env.jwtSecret, { expiresIn: '30m' });
}

export function verifyPasswordResetToken(token) {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (decoded.purpose !== 'password_reset') {
    throw new Error('Invalid reset token');
  }
  return decoded;
}
