import type { Request, Response } from 'express';
import * as readerService from '../services/readerService.js';

export async function getDashboardOverview(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const overview = await readerService.getDashboardOverview(userId);
    return res.json(overview);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return res.status(500).json({ message: 'Failed to load dashboard overview' });
  }
}

export async function getWeeklyStats(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const stats = await readerService.getWeeklyStats(userId);
    return res.json(stats);
  } catch (error) {
    console.error('Weekly stats error:', error);
    return res.status(500).json({ message: 'Failed to load weekly stats' });
  }
}

export async function getMonthlyStats(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const stats = await readerService.getMonthlyStats(userId);
    return res.json(stats);
  } catch (error) {
    console.error('Monthly stats error:', error);
    return res.status(500).json({ message: 'Failed to load monthly stats' });
  }
}

export async function getCategoryDistribution(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const distribution = await readerService.getCategoryDistribution(userId);
    return res.json(distribution);
  } catch (error) {
    console.error('Category distribution error:', error);
    return res.status(500).json({ message: 'Failed to load category distribution' });
  }
}

export async function getReadingCalendar(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const calendar = await readerService.getReadingCalendar(userId, year);
    return res.json(calendar);
  } catch (error) {
    console.error('Reading calendar error:', error);
    return res.status(500).json({ message: 'Failed to load reading calendar' });
  }
}

export async function getBadges(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const reEvaluate = req.query.evaluate === 'true';
    const badges = await readerService.getBadges(userId, reEvaluate);
    return res.json(badges);
  } catch (error) {
    console.error('Badges error:', error);
    return res.status(500).json({ message: 'Failed to load badges' });
  }
}

export async function evaluateBadges(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const badges = await readerService.getBadges(userId, true);
    return res.json({ success: true, badges });
  } catch (error) {
    console.error('Badge evaluation error:', error);
    return res.status(500).json({ message: 'Failed to evaluate badges' });
  }
}

export async function getGoals(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const goals = await readerService.getGoals(userId);
    return res.json(goals);
  } catch (error) {
    console.error('Goals error:', error);
    return res.status(500).json({ message: 'Failed to load goals' });
  }
}

export async function updateGoal(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { type, target } = req.body as { type: 'weekly' | 'monthly'; target: number };
    if (!type || typeof target !== 'number' || target < 1) {
      return res.status(400).json({ message: 'Invalid goal: type and target are required' });
    }

    const goal = await readerService.updateGoal(userId, type, target);
    return res.json(goal);
  } catch (error) {
    console.error('Goal update error:', error);
    return res.status(500).json({ message: 'Failed to update goal' });
  }
}

export async function getCompletedSeries(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const series = await readerService.getCompletedSeries(userId);
    return res.json(series);
  } catch (error) {
    console.error('Completed series error:', error);
    return res.status(500).json({ message: 'Failed to load completed series' });
  }
}

export async function getSavedArticles(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const saved = await readerService.getSavedArticles(userId);
    return res.json(saved);
  } catch (error) {
    console.error('Saved articles error:', error);
    return res.status(500).json({ message: 'Failed to load saved articles' });
  }
}

