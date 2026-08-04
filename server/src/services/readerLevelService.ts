import { prisma } from './prisma.js';
import { READER_LEVELS, LEADERBOARD_WEIGHTS } from './leaderboardConfig.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LevelInfo {
  key: string;
  labelEn: string;
  labelAr: string;
  minXp: number;
  color: string;
}

export interface LevelProgress {
  level: LevelInfo;
  xp: number;
  currentThreshold: number;
  nextThreshold: number | null;
  progress: number; // 0-100 within the current level
  toNext: number | null;
}

// ─── Level resolution ───────────────────────────────────────────────────────

export function getLevelForXp(xp: number): LevelInfo {
  let current = READER_LEVELS[0];
  for (const lvl of READER_LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
  }
  return current;
}

export function getLevelProgress(xp: number): LevelProgress {
  const level = getLevelForXp(xp);
  const currentThreshold = level.minXp;
  const idx = READER_LEVELS.findIndex((l) => l.key === level.key);
  const next = READER_LEVELS[idx + 1] || null;

  if (!next) {
    return {
      level,
      xp,
      currentThreshold,
      nextThreshold: null,
      progress: 100,
      toNext: null,
    };
  }

  const span = next.minXp - currentThreshold;
  const progress = Math.min(100, Math.round(((xp - currentThreshold) / Math.max(span, 1)) * 100));
  return {
    level,
    xp,
    currentThreshold,
    nextThreshold: next.minXp,
    progress,
    toNext: next.minXp - xp,
  };
}

// ─── XP computation ─────────────────────────────────────────────────────────
// Total XP is derived from the same weighted metrics as the leaderboard so the
// level stays in sync with overall activity. Each metric's contribution is
// additive (count * weight).

export async function computeXp(userId: string): Promise<number> {
  const w = LEADERBOARD_WEIGHTS;

  const completedReads = await prisma.readingHistory.count({
    where: { userId, progress: { gte: 100 } },
  });

  const completedArticles = await prisma.readingHistory.count({
    where: { userId, contentType: 'article', progress: { gte: 100 } },
  });

  const reviews = await prisma.bookReview.count({
    where: { userId, status: 'published' },
  });

  const helpfulVotes = await prisma.reviewHelpful.count({
    where: { review: { userId } },
  });

  const comments = await prisma.comment.count({ where: { userId } });
  const threads = await prisma.communityThread.count({ where: { authorId: userId } });
  const reactions = await prisma.reaction.count({ where: { userId } });
  const likes = await prisma.like.count({ where: { userId } });
  const community = comments + threads + reactions + likes;

  // Completed series: count of novels where every chapter has been read.
  const completedSeries = await countCompletedSeries(userId);

  return (
    completedReads * w.readingPoint +
    completedArticles * w.completedArticle +
    completedSeries * w.completedSeries +
    reviews * w.review +
    helpfulVotes * w.helpfulVote +
    community * w.community
  );
}

// ─── Level sync ─────────────────────────────────────────────────────────────
// Recomputes the user's XP and persists the derived level to User.level.

export async function syncUserLevel(userId: string): Promise<LevelInfo> {
  const xp = await computeXp(userId);
  const level = getLevelForXp(xp);
  await prisma.user.update({
    where: { id: userId },
    data: { level: level.key as any },
  });
  return level;
}

export async function getLevelProgressForUser(userId: string): Promise<LevelProgress> {
  const xp = await computeXp(userId);
  return getLevelProgress(xp);
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

export async function countCompletedSeries(userId: string): Promise<number> {
  const novelChapters = await prisma.chapter.findMany({ select: { id: true, novelId: true } });
  const novelMap = new Map<string, string[]>();
  novelChapters.forEach((ch) => {
    const existing = novelMap.get(ch.novelId) || [];
    existing.push(ch.id);
    novelMap.set(ch.novelId, existing);
  });

  const completedChapters = await prisma.readingHistory.findMany({
    where: { userId, contentType: 'chapter', progress: { gte: 100 } },
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
