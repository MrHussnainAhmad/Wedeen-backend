import { Router } from 'express';
import {
  deleteMemorization,
  getLearningProgress,
  getMemorization,
  getMemorizationStats,
  markMemorization,
  unlockNextSurah,
  updateMemorization
} from '../controllers/memorizationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateMarkMemorization, validateUnlockSurah } from '../middleware/validateMiddleware.js';

const router = Router();

router.use(authMiddleware);
router.get('/', getMemorization);
router.get('/progress', getLearningProgress);
router.post('/progress/unlock', validateUnlockSurah, unlockNextSurah);
router.post('/mark', validateMarkMemorization, markMemorization);
router.put('/update', updateMemorization);
router.delete('/:id', deleteMemorization);
router.get('/stats', getMemorizationStats);

export default router;
