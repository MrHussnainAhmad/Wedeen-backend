import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { deleteAccountCompliance } from '../controllers/complianceController.js';

const router = Router();

const complianceDeleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/delete-account', complianceDeleteLimiter, deleteAccountCompliance);

export default router;
