import { Router } from 'express';
import {
  deleteAccount,
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
  updatePassword
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  validateForgotPassword,
  validateLogin,
  validatePasswordUpdate,
  validateRegister,
  validateResetPassword
} from '../middleware/validateMiddleware.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/me', authMiddleware, me);
router.put('/password', authMiddleware, validatePasswordUpdate, updatePassword);
router.delete('/account', authMiddleware, deleteAccount);

export default router;
