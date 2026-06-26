import { Router } from 'express';
import {
  getPartsByNovel,
  createPart,
  updatePart,
  deletePart,
  reorderPart,
  moveChapter,
  reorderChapters,
} from '../controllers/partController.js';
import { authGuard } from '../middleware/authGuard.js';

export const partRoutes = Router();

// Get parts by novel - public
partRoutes.get('/novel/:novelId/parts', getPartsByNovel);

// Create part - auth required
partRoutes.post('/parts', authGuard, createPart);

// Update part - auth required
partRoutes.put('/parts/:partId', authGuard, updatePart);

// Delete part - auth required
partRoutes.delete('/parts/:partId', authGuard, deletePart);

// Reorder part - auth required
partRoutes.post('/parts/:partId/reorder', authGuard, reorderPart);

// Move chapter to different part - auth required
partRoutes.post('/chapters/:chapterId/move', authGuard, moveChapter);

// Reorder chapters within a part - auth required
partRoutes.post('/parts/:partId/chapters/reorder', authGuard, reorderChapters);