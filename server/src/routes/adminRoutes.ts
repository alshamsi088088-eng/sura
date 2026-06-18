
import { Router } from 'express';
import { getOverview } from '../controllers/adminController.js';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';

export const adminRoutes = Router();
adminRoutes.get('/overview', authGuard, roleGuard(['admin', 'editor']), getOverview);
