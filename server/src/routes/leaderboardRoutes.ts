import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import { roleGuard } from '../middleware/roleGuard.js';
import {
  getLeaderboard,
  getMyRank,
  getLevels,
  getProfilePreview,
  refreshAll,
} from '../controllers/leaderboardController.js';

export const leaderboardRoutes = Router();

// Public (leaderboard is viewable by guests)
leaderboardRoutes.get('/leaderboard', getLeaderboard);
leaderboardRoutes.get('/leaderboard/levels', getLevels);
leaderboardRoutes.get('/leaderboard/user/:userId', getProfilePreview);

// Authenticated — current user's rank
leaderboardRoutes.get('/leaderboard/me', authGuard, getMyRank);

// Admin-only — force refresh all cached snapshots
leaderboardRoutes.post('/leaderboard/refresh', authGuard, roleGuard('admin'), refreshAll);
