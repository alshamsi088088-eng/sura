import { Router } from 'express';
import {
  listAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  toggleAd,
  getUploadUrl,
  trackAdEvent,
  getAdMetrics,
  getSlotAds,
  getAuditLogs
} from '../controllers/adController.js';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

export const adRoutes = Router();

// Public slot ads and tracking
adRoutes.get('/slot/:position', getSlotAds);
adRoutes.post('/track', rateLimiter(60, 60), trackAdEvent);

// Admin
adRoutes.get('/upload/url', authGuard, roleGuard('admin'), getUploadUrl);
adRoutes.get('/', authGuard, roleGuard('admin'), listAds);
adRoutes.post('/', authGuard, roleGuard('admin'), createAd);
adRoutes.get('/audit-logs', authGuard, roleGuard('admin'), getAuditLogs);
adRoutes.get('/:id/metrics', authGuard, roleGuard('admin'), getAdMetrics);
adRoutes.get('/:id', authGuard, roleGuard('admin'), getAd);
adRoutes.put('/:id', authGuard, roleGuard('admin'), updateAd);
adRoutes.delete('/:id', authGuard, roleGuard('admin'), deleteAd);
adRoutes.post('/:id/toggle', authGuard, roleGuard('admin'), toggleAd);
