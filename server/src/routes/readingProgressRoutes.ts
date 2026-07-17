import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import {
  getProgressByEntityId,
  getWeeklyProgress,
  getWeeklyTarget,
  saveProgressByEntityId,
  saveWeeklyTarget,
} from '../controllers/readingProgressController.js';

export const readingProgressRoutes = Router();

readingProgressRoutes.get('/weekly-progress', authGuard, getWeeklyProgress);
readingProgressRoutes.get('/weekly-target', authGuard, getWeeklyTarget);
readingProgressRoutes.post('/weekly-target', authGuard, saveWeeklyTarget);
readingProgressRoutes.get('/progress/:entityId', authGuard, getProgressByEntityId);
readingProgressRoutes.post('/progress/:entityId', authGuard, saveProgressByEntityId);
