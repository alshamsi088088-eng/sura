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
// These use authGuard optionally (the controller handles missing user gracefully)

seriesRoutes.get('/series', (req, res, next) => {
  // Auth is optional — pass through even if not authenticated
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return getAllSeries(req, res);
  next();
}, authGuard, getAllSeries);

seriesRoutes.get('/series/:slug', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return getSeriesBySlug(req, res);
  next();
}, authGuard, getSeriesBySlug);

seriesRoutes.get('/series/:slug/progress', authGuard, getSeriesProgress);
seriesRoutes.get('/recommended-series', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return getRecommendedSeries(req, res);
  next();
}, authGuard, getRecommendedSeries);

// ─── Admin Routes ───────────────────────────────────────────────────────────

seriesRoutes.post('/admin/series', authGuard, roleGuard(['admin', 'editor']), adminCreateSeries);
seriesRoutes.put('/admin/series/:id', authGuard, roleGuard(['admin', 'editor']), adminUpdateSeries);
seriesRoutes.delete('/admin/series/:id', authGuard, roleGuard('admin'), adminDeleteSeries);
seriesRoutes.put('/admin/series/:id/reorder', authGuard, roleGuard(['admin', 'editor']), adminReorderSeriesItems);
seriesRoutes.post('/admin/series/:id/items', authGuard, roleGuard(['admin', 'editor']), adminAssignItem);
seriesRoutes.delete('/admin/series/:id/items/:itemId', authGuard, roleGuard(['admin', 'editor']), adminRemoveItem);
