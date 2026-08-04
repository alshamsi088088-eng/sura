import { Request, Response } from 'express';
import {
  LEADERBOARD_PERIODS,
  LeaderboardPeriod,
  DEFAULT_LEADERBOARD_LIMIT,
} from '../services/leaderboardConfig.js';
import * as leaderboardService from '../services/leaderboardService.js';
import { READER_LEVELS } from '../services/leaderboardConfig.js';

function parsePeriod(value: string | undefined): LeaderboardPeriod {
  if (value && (LEADERBOARD_PERIODS as readonly string[]).includes(value)) {
    return value as LeaderboardPeriod;
  }
  return 'alltime';
}

export async function getLeaderboard(req: Request, res: Response) {
  try {
    const period = parsePeriod(req.query.period as string | undefined);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : DEFAULT_LEADERBOARD_LIMIT;
    const refresh = req.query.refresh === 'true';

    const data = await leaderboardService.getLeaderboard(period, limit, { refresh });
    return res.json(data);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return res.status(500).json({ message: 'Failed to load leaderboard' });
  }
}

export async function getMyRank(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const period = parsePeriod(req.query.period as string | undefined);
    const data = await leaderboardService.getMyRank(period, userId);

    // If no snapshot exists yet, generate one and retry.
    if (data.rank === null) {
      await leaderboardService.generateSnapshot(period);
      const retry = await leaderboardService.getMyRank(period, userId);
      return res.json(retry);
    }

    return res.json(data);
  } catch (error) {
    console.error('My rank error:', error);
    return res.status(500).json({ message: 'Failed to load your rank' });
  }
}

export async function getLevels(_req: Request, res: Response) {
  try {
    return res.json({ levels: READER_LEVELS });
  } catch (error) {
    console.error('Levels fetch error:', error);
    return res.status(500).json({ message: 'Failed to load levels' });
  }
}

export async function getProfilePreview(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const data = await leaderboardService.getProfilePreview(userId);
    if (!data) return res.status(404).json({ message: 'User not found' });
    return res.json(data);
  } catch (error) {
    console.error('Profile preview error:', error);
    return res.status(500).json({ message: 'Failed to load profile' });
  }
}

export async function refreshAll(req: Request, res: Response) {
  try {
    const results = await leaderboardService.refreshAllSnapshots();
    return res.json({ success: true, results });
  } catch (error) {
    console.error('Leaderboard refresh error:', error);
    return res.status(500).json({ message: 'Failed to refresh leaderboard' });
  }
}
