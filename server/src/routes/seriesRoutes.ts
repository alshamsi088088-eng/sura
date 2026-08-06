import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import {
  getAllSeries,
  getSeriesBySlug,
  getSeriesProgress,
  getRecommendedSeries,
  adminCreateSeries,
  adminUpdateSeries,
  adminDeleteSeries,
  adminReorderSeriesItems,
  adminAssignItem,
  adminRemoveItem,
} from '../controllers/seriesController.js';

export const seriesRoutes = Router();

// ─── Public Routes ──────────────────────────────────────────────────────────
// GET endpoints are fully public — they must NEVER hit authGuard so anonymous
// visitors (or those with a stale/expired token) always receive HTTP 200.
// The controllers read (req as any).user?.id defensively, so it is safe to
// call them without authentication.

seriesRoutes.get('/series', getAllSeries);

seriesRoutes.get('/series/:slug', getSeriesBySlug);

// Progress is only meaningful for authenticated users, but the controller
// returns 401 only when a userId is actually required. Public GET must
// remain reachable without auth.
seriesRoutes.get('/series/:slug/progress', getSeriesProgress);
seriesRoutes.get('/recommended-series', getRecommendedSeries);

// ─── Admin Routes ───────────────────────────────────────────────────────────

seriesRoutes.post('/admin/series', authGuard, roleGuard(['admin', 'editor']), adminCreateSeries);
seriesRoutes.put('/admin/series/:id', authGuard, roleGuard(['admin', 'editor']), adminUpdateSeries);
seriesRoutes.delete('/admin/series/:id', authGuard, roleGuard('admin'), adminDeleteSeries);
seriesRoutes.put('/admin/series/:id/reorder', authGuard, roleGuard(['admin', 'editor']), adminReorderSeriesItems);
seriesRoutes.post('/admin/series/:id/items', authGuard, roleGuard(['admin', 'editor']), adminAssignItem);
seriesRoutes.delete('/admin/series/:id/items/:itemId', authGuard, roleGuard(['admin', 'editor']), adminRemoveItem);
