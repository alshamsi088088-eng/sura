import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import {
  getDashboardOverview,
  getWeeklyStats,
  getMonthlyStats,
  getCategoryDistribution,
  getReadingCalendar,
  getBadges,
  evaluateBadges,
  getGoals,
  updateGoal,
  getCompletedSeries,
  getSavedArticles,
} from '../controllers/readerController.js';

export const readerRoutes = Router();

// All reader routes require authentication
readerRoutes.use(authGuard);

// Dashboard overview — single aggregated endpoint for performance
readerRoutes.get('/reader/dashboard', getDashboardOverview);

// Reading statistics
readerRoutes.get('/reader/stats/weekly', getWeeklyStats);
readerRoutes.get('/reader/stats/monthly', getMonthlyStats);
readerRoutes.get('/reader/stats/categories', getCategoryDistribution);
readerRoutes.get('/reader/stats/calendar', getReadingCalendar);

// Badges
readerRoutes.get('/reader/badges', getBadges);
readerRoutes.post('/reader/badges/evaluate', evaluateBadges);

// Reading goals
readerRoutes.get('/reader/goals', getGoals);
readerRoutes.post('/reader/goals', updateGoal);

// Saved & completed
readerRoutes.get('/reader/saved', getSavedArticles);
readerRoutes.get('/reader/completed-series', getCompletedSeries);

