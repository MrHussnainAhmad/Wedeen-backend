import { Router } from 'express';
import {
  syncSalah,
  getSalah,
  syncTasbih,
  getTasbih,
  syncAchievements,
  getAchievements,
  syncFavorites,
  getFavorites,
  syncZakat,
  getZakat,
  syncFasting,
  getFasting,
  syncPlaceFavorites,
  getPlaceFavorites,
  syncDuas,
  getDuas,
  syncReflections,
  getReflections
} from '../controllers/syncController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Salah routes
router.post('/salah', syncSalah);
router.get('/salah', getSalah);

// Tasbih routes
router.post('/tasbih', syncTasbih);
router.get('/tasbih', getTasbih);

// Achievement routes
router.post('/achievements', syncAchievements);
router.get('/achievements', getAchievements);

// Favorites routes
router.post('/favorites', syncFavorites);
router.get('/favorites', getFavorites);

// Phase 1 feature sync routes
router.post('/zakat', syncZakat);
router.get('/zakat', getZakat);
router.post('/fasting', syncFasting);
router.get('/fasting', getFasting);
router.post('/place-favorites', syncPlaceFavorites);
router.get('/place-favorites', getPlaceFavorites);
router.post('/duas', syncDuas);
router.get('/duas', getDuas);

// Daily reflections routes
router.post('/reflections', syncReflections);
router.get('/reflections', getReflections);

export default router;
