import type { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

const weeklyTargets = new Map<string, number>();

export function getCurrentWeekKey(date = new Date()) {
  const tempDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - day);

  const year = tempDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function buildWeeklyProgressPayload(records: Array<{ contentType: string; progress: number }>) {
  const completed = records.filter((record) => record.progress >= 100).length;
  const average = records.length > 0 ? Math.round(records.reduce((sum, record) => sum + record.progress, 0) / records.length) : 0;
  const articles = records.filter((record) => record.contentType === 'article' && record.progress >= 100).length;
  const chapters = records.filter((record) => record.contentType === 'novel' && record.progress >= 100).length;

  return { completed, average, articles, chapters };
}

export async function getWeeklyProgress(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const weekKey = getCurrentWeekKey();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const records = await prisma.readingHistory.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      select: {
        contentType: true,
        progress: true,
      },
    });

    return res.json({
      week: weekKey,
      ...buildWeeklyProgressPayload(records),
    });
  } catch (error) {
    console.error('Weekly progress fetch failed', error);
    return res.status(500).json({ message: 'Unable to load weekly progress' });
  }
}

export async function getWeeklyTarget(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const weekKey = getCurrentWeekKey();
    const target = weeklyTargets.get(userId) ?? 5;

    return res.json({
      week: weekKey,
      target,
      articles: 0,
      chapters: 0,
      date: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weekly target fetch failed', error);
    return res.status(500).json({ message: 'Unable to load weekly target' });
  }
}

export async function saveWeeklyTarget(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { target } = req.body as { target?: number };
    if (typeof target !== 'number' || target < 1) {
      return res.status(400).json({ message: 'Invalid weekly target' });
    }

    weeklyTargets.set(userId, target);
    return res.json({ success: true, target });
  } catch (error) {
    console.error('Weekly target save failed', error);
    return res.status(500).json({ message: 'Unable to save weekly target' });
  }
}

export async function getProgressByEntityId(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { entityId } = req.params;
    const entityType = (req.query.entityType as string | undefined) || 'article';

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const record = await prisma.readingHistory.findFirst({
      where: {
        userId,
        contentType: entityType,
        contentId: entityId,
      },
      select: { progress: true },
    });

    return res.json({ progress: record?.progress ?? 0, entityType, entityId });
  } catch (error) {
    console.error('Progress fetch failed', error);
    return res.status(500).json({ message: 'Unable to load reading progress' });
  }
}

export async function saveProgressByEntityId(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { entityId } = req.params;
    const { entityType = 'article', currentStep, totalSteps, progress, title } = req.body as {
      entityType?: string;
      currentStep?: number;
      totalSteps?: number;
      progress?: number;
      title?: string;
    };

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const nextProgress = typeof progress === 'number' ? progress : Math.min(100, Math.round(((currentStep ?? 0) / Math.max(totalSteps ?? 1, 1)) * 100));

    await prisma.readingHistory.upsert({
      where: {
        userId_contentType_contentId: {
          userId,
          contentType: entityType,
          contentId: entityId,
        },
      },
      update: {
        progress: nextProgress,
        title: title ?? undefined,
      },
      create: {
        userId,
        contentType: entityType,
        contentId: entityId,
        progress: nextProgress,
        title: title ?? undefined,
      },
    });

    return res.json({ success: true, progress: nextProgress });
  } catch (error) {
    console.error('Progress save failed', error);
    return res.status(500).json({ message: 'Unable to save reading progress' });
  }
}
