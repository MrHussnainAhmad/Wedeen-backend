import { verifyToken } from '../services/tokenService.js';
import { unauthorized } from '../utils/errors.js';

export function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(unauthorized('Missing or invalid authorization header'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id };
    return next();
  } catch {
    return next(unauthorized('Invalid or expired token'));
  }
}
