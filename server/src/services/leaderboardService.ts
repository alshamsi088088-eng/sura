import { prisma } from './prisma.js';
import {
  LEADERBOARD_WEIGHTS,
  LEADERBOARD_PERIODS,
  LeaderboardPeriod,
  DEFAULT_LEADERBOARD_LIMIT,
  MAX_LEADERBOARD_LIMIT,
} from './leaderboardConfig.js';
import { countCompletedSeries } from './readerLevelService.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LeaderboardMetrics {
  readingPoints: number;
  completedArticles: number;
  completedSeries: number;
  reviews: number;
  helpfulVotes: number;
  community: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  level: string;
  score: number;
  metrics: LeaderboardMetrics;
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  periodKey: string;
  generatedAt: string;
  entries: LeaderboardEntry[];
  total: number;
}

// ─── Period helpers ─────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((d.getTime() - start.getTime()) / 86400000) + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getPeriodKey(period: LeaderboardPeriod, date: Date = new Date()): string {
  switch (period) {
    case 'daily':
      return toDateKey(date);
    case 'weekly':
      return getWeekKey(date);
    case 'monthly':
      return getMonthKey(date);
    case 'alltime':
      return 'all';
    default:
      return 'all';
  }
}

export function getPeriodStart(period: LeaderboardPeriod, date: Date = new Date()): Date {
  const now = new Date(date);
  switch (period) {
    case 'daily': {
      const s = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      return s;
    }
    case 'weekly': {
      const s = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const day = s.getUTCDay() || 7;
      s.setUTCDate(s.getUTCDate() - (day - 1));
      return s;
    }
    case 'monthly': {
      return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    }
    case 'alltime':
    default:
      return new Date(0);
  }
}

// ─── Metric computation (per user, per period window) ───────────────────────

export async function computeUserMetrics(
  userId: string,
  since: Date
): Promise<LeaderboardMetrics> {
  const w = LEADERBOARD_WEIGHTS;

  const completedReads = await prisma.readingHistory.count({
    where: { userId, progress: { gte: 100 }, createdAt: { gte: since } },
  });

  const completedArticles = await prisma.readingHistory.count({
    where: { userId, contentType: 'article', progress: { gte: 100 }, createdAt: { gte: since } },
  });

  const reviews = await prisma.bookReview.count({
    where: { userId, status: 'published', createdAt: { gte: since } },
  });

  const helpfulVotes = await prisma.reviewHelpful.count({
    where: { createdAt: { gte: since }, review: { userId } },
  });

  const comments = await prisma.comment.count({
    where: { userId, createdAt: { gte: since } },
  });
  const threads = await prisma.communityThread.count({
    where: { authorId: userId, createdAt: { gte: since } },
  });
  const reactions = await prisma.reaction.count({
    where: { userId, createdAt: { gte: since } },
  });
  const likes = await prisma.like.count({
    where: { userId, createdAt: { gte: since } },
  });
  const community = comments + threads + reactions + likes;

  // Completed series: novels where every chapter has been read (all-time halves only
  // when the period is alltime; for time-based periods we count novels completed within
  // the window using the latest chapter completion date).
  let completedSeries = 0;
  if (since.getTime() === 0) {
    completedSeries = await countCompletedSeries(userId);
  } else {
    completedSeries = await countCompletedSeriesWithin(userId, since);
  }

  const readingPoints = completedReads * w.readingPoint;

  return {
    readingPoints,
    completedArticles,
    completedSeries,
    reviews,
    helpfulVotes,
    community,
  };
}

// Counts completed series where the *last* chapter read in the window is at 100%.
async function countCompletedSeriesWithin(userId: string, since: Date): Promise<number> {
  const novelChapters = await prisma.chapter.findMany({ select: { id: true, novelId: true } });
  const novelMap = new Map<string, string[]>();
  novelChapters.forEach((ch) => {
    const existing = novelMap.get(ch.novelId) || [];
    existing.push(ch.id);
    novelMap.set(ch.novelId, existing);
  });

  const completedChapters = await prisma.readingHistory.findMany({
    where: {
      userId,
      contentType: 'chapter',
      progress: { gte: 100 },
      createdAt: { gte: since },
    },
    select: { contentId: true },
  });
  const completedChapterIds = new Set(completedChapters.map((h) => h.contentId));

  let count = 0;
  for (const [, chapterIds] of novelMap) {
    if (chapterIds.length > 0 && chapterIds.every((cid) => completedChapterIds.has(cid))) {
      count++;
    }
  }
  return count;
}

export function computeScore(metrics: LeaderboardMetrics): number {
  const w = LEADERBOARD_WEIGHTS;
  return (
    metrics.readingPoints +
    metrics.completedArticles * w.completedArticle +
    metrics.completedSeries * w.completedSeries +
    metrics.reviews * w.review +
    metrics.helpfulVotes * w.helpfulVote +
    metrics.community * w.community
  );
}

// ─── Snapshot generation ────────────────────────────────────────────────────

export async function generateSnapshot(period: LeaderboardPeriod): Promise<LeaderboardResponse> {
  await prisma.leaderboardSnapshot.deleteMany({ where: { period } });

  const periodKey = getPeriodKey(period);
  const since = getPeriodStart(period);

  const users = await prisma.user.findMany({ select: { id: true } });

  const rows: Array<{
    userId: string;
    score: number;
    metrics: LeaderboardMetrics;
  }> = [];

  for (const u of users) {
    const metrics = await computeUserMetrics(u.id, since);
    const score = computeScore(metrics);
    if (score > 0) {
      rows.push({ userId: u.id, score, metrics });
    }
  }

  rows.sort((a, b) => b.score - a.score);

  const entries: LeaderboardEntry[] = [];
  const userInfos = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.userId) } },
    select: { id: true, name: true, avatar: true, level: true },
  });
const userMap = new Map(userInfos.map((u) => [u.id, u]));

  rows.forEach((row, index) => {
    const rank = index + 1;
    const info = userMap.get(row.userId);
    entries.push({
      rank,
      userId: row.userId,
      name: info?.name || 'Unknown',
      avatar: info?.avatar || null,
      level: (info?.level as string) || 'BRONZE',
      score: row.score,
      metrics: row.metrics,
    });
  });

  // Persist all cache rows (await so the cache is fully populated before returning).
  await prisma.leaderboardSnapshot.createMany({
    data: entries.map((e) => ({
      period,
      periodKey,
      userId: e.userId,
      score: e.score,
      rank: e.rank,
      metrics: JSON.parse(JSON.stringify(e.metrics)) as any,
    })),
  });

  return {
    period,
    periodKey,
    generatedAt: new Date().toISOString(),
    entries,
    total: entries.length,
  };
}

// ─── Snapshot refresh all periods ───────────────────────────────────────────

export async function refreshAllSnapshots(): Promise<Record<LeaderboardPeriod, LeaderboardResponse>> {
  const results = {} as Record<LeaderboardPeriod, LeaderboardResponse>;
  for (const period of LEADERBOARD_PERIODS) {
    results[period] = await generateSnapshot(period);
  }
  return results;
}

// ─── Query snapshot ─────────────────────────────────────────────────────────

export async function getLeaderboard(
  period: LeaderboardPeriod,
  limit = DEFAULT_LEADERBOARD_LIMIT,
  options?: { refresh?: boolean }
): Promise<LeaderboardResponse> {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LEADERBOARD_LIMIT);
  const periodKey = getPeriodKey(period);

  if (options?.refresh) {
    return generateSnapshot(period);
  }

  // Try to serve from cache first.
  const cachedCheck = await prisma.leaderboardSnapshot.findFirst({
    where: { period, periodKey },
    select: { id: true },
  });

  if (cachedCheck) {
    const rows = await prisma.leaderboardSnapshot.findMany({
      where: { period, periodKey },
      orderBy: { rank: 'asc' },
      take: safeLimit,
      include: {
        user: { select: { id: true, name: true, avatar: true, level: true } },
      },
    });

    const entries: LeaderboardEntry[] = rows.map((r) => ({
      rank: r.rank,
      userId: r.userId,
      name: r.user.name,
      avatar: r.user.avatar,
      level: (r.user.level as string) || 'BRONZE',
      score: r.score,
      metrics: (r.metrics as unknown) as LeaderboardMetrics,
    }));

    const total = await prisma.leaderboardSnapshot.count({ where: { period, periodKey } });

    return {
      period,
      periodKey,
      generatedAt: rows[0]?.createdAt.toISOString() || new Date().toISOString(),
      entries,
      total,
    };
  }

  // No cache → generate and return.
  return generateSnapshot(period);
}

// ─── Current user rank ──────────────────────────────────────────────────────

export async function getMyRank(period: LeaderboardPeriod, userId: string) {
  const periodKey = getPeriodKey(period);
  const snapshot = await prisma.leaderboardSnapshot.findUnique({
    where: {
      period_periodKey_userId: { period, periodKey, userId },
    },
    include: {
      user: { select: { id: true, name: true, avatar: true, level: true } },
    },
  });

  if (!snapshot) {
    return {
      period,
      periodKey,
      rank: null,
      score: 0,
      metrics: null,
      user: null,
    };
  }

  return {
    period,
    periodKey,
    rank: snapshot.rank,
    score: snapshot.score,
    metrics: snapshot.metrics as unknown as LeaderboardMetrics,
    user: {
      id: snapshot.user.id,
      name: snapshot.user.name,
      avatar: snapshot.user.avatar,
      level: snapshot.user.level as string,
    },
  };
}

// ─── Public profile preview ─────────────────────────────────────────────────

export async function getProfilePreview(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatar: true, bio: true, level: true },
  });
  if (!user) return null;

  const xp = await computeXpPublic(userId);
  const allTime = await prisma.leaderboardSnapshot.findUnique({
    where: { period_periodKey_userId: { period: 'alltime', periodKey: 'all', userId } },
    select: { rank: true, score: true },
  });

  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    level: user.level as string,
    xp,
    allTimeRank: allTime?.rank ?? null,
    allTimeScore: allTime?.score ?? 0,
  };
}

async function computeXpPublic(userId: string): Promise<number> {
  const { computeXp } = await import('./readerLevelService.js');
  return computeXp(userId);
}
