import { Router } from 'express';
import {
  getAuthorOverview,
  getTopContent,
  getReactionBreakdown,
  getDailyTrend,
  getWeeklyTrend
} from '../controllers/analyticsController.js';

const router = Router();

router.get('/overview', getAuthorOverview);
router.get('/top-content', getTopContent);
router.get('/reactions', getReactionBreakdown);
router.get('/daily', getDailyTrend);
router.get('/weekly', getWeeklyTrend);

export default router;