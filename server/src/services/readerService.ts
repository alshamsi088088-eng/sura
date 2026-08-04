import { prisma } from './prisma.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DashboardOverview {
  totalArticlesRead: number;
  readingStreak: number;
  readingTimeMinutes: number;
  favoriteCategory: string | null;
  savedArticles: number;
  recentlyViewed: Array<{
    id: string;
    title: string;
    contentType: string;
    progress: number;
    updatedAt: Date;
  }>;
  completedSeries: number;
}

export interface WeeklyStats {
  week: string;
  items: Array<{ date: string; count: number }>;
  total: number;
}

export interface MonthlyStats {
  month: string;
  items: Array<{ week: string; count: number }>;
  total: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface CalendarDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface BadgeInfo {
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
  progress: number;
}

export interface GoalInfo {
  type: 'weekly' | 'monthly';
  target: number;
  progress: number;
  percentage: number;
}

// ─── Badge definitions ──────────────────────────────────────────────────────

const BADGE_DEFS: Record<string, { title: string; description: string; icon: string }> = {
  first_article: { title: 'First Article', description: 'Read your first article to completion', icon: '📝' },
  streak_7: { title: '7-Day Streak', description: 'Read for 7 days in a row', icon: '🔥' },
  streak_30: { title: '30-Day Streak', description: 'Read for 30 days in a row', icon: '⚡' },
  book_explorer: { title: 'Book Explorer', description: 'Explore articles from 3+ different categories', icon: '🌍' },
  top_reader: { title: 'Top Reader', description: 'Read 50+ articles or chapters', icon: '👑' },
  reviewer: { title: 'Reviewer', description: 'Leave 5+ comments on articles or chapters', icon: '✨' },
  community_helper: { title: 'Community Helper', description: 'Participate in 3+ community discussions', icon: '🤝' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function formatDateLocal(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ─── Dashboard overview ─────────────────────────────────────────────────────

export async function getDashboardOverview(userId: string): Promise<DashboardOverview> {
  // 1. Total articles read (progress >= 100%)
  const completedHistory = await prisma.readingHistory.count({
    where: { userId, progress: { gte: 100 } },
  });

  // 2. Reading streak
  const rawEntries = await prisma.readingHistory.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const uniqueDays = [...new Set(rawEntries.map((e) => formatDateLocal(e.createdAt)))].sort().reverse();
  let streak = 0;
  const today = formatDateLocal(new Date());
  const yesterday = formatDateLocal(new Date(Date.now() - 86400000));
  if (uniqueDays.length > 0 && (uniqueDays[0] === today || uniqueDays[0] === yesterday)) {
    streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diff === 1) streak++;
      else break;
    }
  }

  // 3. Reading time
  const historyWithContent = await prisma.readingHistory.findMany({
    where: { userId, progress: { gte: 100 } },
    select: { contentType: true, contentId: true },
  });
  let readingTimeMinutes = 0;
  for (const entry of historyWithContent) {
    if (entry.contentType === 'article') {
      const article = await prisma.article.findUnique({
        where: { id: entry.contentId },
        select: { readingTime: true },
      });
      if (article?.readingTime) {
        const parsed = parseInt(article.readingTime, 10);
        if (!isNaN(parsed)) readingTimeMinutes += parsed;
      }
    } else if (entry.contentType === 'chapter') {
      const chapter = await prisma.chapter.findUnique({
        where: { id: entry.contentId },
        select: { readingTime: true },
      });
      if (chapter?.readingTime) {
        const parsed = parseInt(chapter.readingTime, 10);
        if (!isNaN(parsed)) readingTimeMinutes += parsed;
      }
    }
  }

  // 4. Favorite category
  const historyArticles = await prisma.readingHistory.findMany({
    where: { userId, contentType: 'article' },
    select: { contentId: true },
  });
  const articleIds = historyArticles.map((h) => h.contentId);
  let favoriteCategory: string | null = null;
  if (articleIds.length > 0) {
    const categories = await prisma.article.groupBy({
      by: ['category'],
      where: { id: { in: articleIds } },
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 1,
    });
    if (categories.length > 0) favoriteCategory = categories[0].category;
  }

  // 5. Saved articles
  const savedArticles = await prisma.bookmark.count({ where: { userId } });

  // 6. Recently viewed
  const recent = await prisma.readingHistory.findMany({
    where: { userId },
    select: { contentId: true, contentType: true, title: true, progress: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    distinct: ['contentId'],
  });
  const recentlyViewed = recent
    .filter((r) => r.contentId && r.title)
    .slice(0, 5)
    .map((r) => ({
      id: r.contentId,
      title: r.title || 'Untitled',
      contentType: r.contentType,
      progress: r.progress,
      updatedAt: r.updatedAt,
    }));

  // 7. Completed series
  const novelChapters = await prisma.chapter.findMany({ select: { id: true, novelId: true } });
  const novelMap = new Map<string, string[]>();
  novelChapters.forEach((ch) => {
    const existing = novelMap.get(ch.novelId) || [];
    existing.push(ch.id);
    novelMap.set(ch.novelId, existing);
  });
  const userChapterHistory = await prisma.readingHistory.findMany({
    where: { userId, contentType: 'chapter', progress: { gte: 100 } },
    select: { contentId: true },
  });
  const completedChapterIds = new Set(userChapterHistory.map((h) => h.contentId));
  let completedSeries = 0;
  for (const [, chapterIds] of novelMap) {
    if (chapterIds.length > 0 && chapterIds.every((cid) => completedChapterIds.has(cid))) {
      completedSeries++;
    }
  }

  return {
    totalArticlesRead: completedHistory,
    readingStreak: streak,
    readingTimeMinutes,
    favoriteCategory,
    savedArticles,
    recentlyViewed,
    completedSeries,
  };
}

// ─── Weekly Stats ───────────────────────────────────────────────────────────

export async function getWeeklyStats(userId: string): Promise<WeeklyStats[]> {
  const results: WeeklyStats[] = [];
  const now = new Date();

  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const records = await prisma.readingHistory.findMany({
      where: { userId, createdAt: { gte: weekStart, lte: weekEnd } },
      select: { createdAt: true },
    });

    const dayCount = new Map<string, number>();
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + d);
      dayCount.set(formatDateLocal(date), 0);
    }
    records.forEach((r) => {
      const key = formatDateLocal(r.createdAt);
      dayCount.set(key, (dayCount.get(key) || 0) + 1);
    });

    const items = [...dayCount.entries()].map(([date, count]) => ({ date, count }));
    const total = items.reduce((s, i) => s + i.count, 0);
    results.push({ week: getWeekKey(weekStart), items, total });
  }

  return results;
}

// ─── Monthly Stats ──────────────────────────────────────────────────────────

export async function getMonthlyStats(userId: string): Promise<MonthlyStats[]> {
  const results: MonthlyStats[] = [];
  const now = new Date();

  for (let m = 5; m >= 0; m--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59, 999);

    const records = await prisma.readingHistory.findMany({
      where: { userId, createdAt: { gte: monthStart, lte: monthEnd } },
      select: { createdAt: true },
    });

    const weekCount = new Map<string, number>();
    const monthKey = getMonthKey(monthStart);
    records.forEach((r) => {
      const wk = getWeekKey(r.createdAt);
      weekCount.set(wk, (weekCount.get(wk) || 0) + 1);
    });

    const items = [...weekCount.entries()].map(([week, count]) => ({ week, count }));
    const total = items.reduce((s, i) => s + i.count, 0);
    results.push({ month: monthKey, items, total });
  }

  return results;
}

// ─── Category distribution ──────────────────────────────────────────────────

export async function getCategoryDistribution(userId: string): Promise<CategoryDistribution[]> {
  const historyRecords = await prisma.readingHistory.findMany({
    where: { userId, contentType: 'article' },
    select: { contentId: true },
  });
  const articleIds = historyRecords.map((h) => h.contentId);
  if (articleIds.length === 0) return [];

  const categories = await prisma.article.groupBy({
    by: ['category'],
    where: { id: { in: articleIds } },
    _count: true,
  });

  const total = categories.reduce((s, c) => s + c._count, 0);
  if (total === 0) return [];

  return categories.map((c) => ({
    category: c.category,
    count: c._count,
    percentage: Math.round((c._count / total) * 100),
  }));
}

// ─── Reading calendar ───────────────────────────────────────────────────────

export async function getReadingCalendar(userId: string, year?: number): Promise<CalendarDay[]> {
  const targetYear = year || new Date().getFullYear();
  const start = new Date(targetYear, 0, 1);
  const end = new Date(targetYear, 11, 31, 23, 59, 59, 999);

  const records = await prisma.readingHistory.findMany({
    where: { userId, createdAt: { gte: start, lte: end } },
    select: { createdAt: true },
  });

  const dayCount = new Map<string, number>();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dayCount.set(formatDateLocal(new Date(d)), 0);
  }
  records.forEach((r) => {
    const key = formatDateLocal(r.createdAt);
    dayCount.set(key, (dayCount.get(key) || 0) + 1);
  });

  const maxCount = Math.max(...dayCount.values(), 1);

  return [...dayCount.entries()].map(([date, count]) => {
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (count > 0) {
      const ratio = count / maxCount;
      if (ratio > 0.75) level = 4;
      else if (ratio > 0.5) level = 3;
      else if (ratio > 0.25) level = 2;
      else level = 1;
    }
    return { date, count, level };
  });
}

// ─── Badge evaluation ───────────────────────────────────────────────────────

async function evaluateBadges(userId: string): Promise<void> {
  const completedCount = await prisma.readingHistory.count({
    where: { userId, progress: { gte: 100 } },
  });

  const rawDays = await prisma.readingHistory.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const uniqueDays = [...new Set(rawDays.map((r) => formatDateLocal(r.createdAt)))].sort();

  let maxStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < uniqueDays.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) currentStreak++;
      else currentStreak = 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  const historyArticles = await prisma.readingHistory.findMany({
    where: { userId, contentType: 'article' },
    select: { contentId: true },
  });
  const articleIds = historyArticles.map((h) => h.contentId);
  let categoryCount = 0;
  if (articleIds.length > 0) {
    const cats = await prisma.article.groupBy({
      by: ['category'],
      where: { id: { in: articleIds } },
    });
    categoryCount = cats.length;
  }

  const commentCount = await prisma.comment.count({ where: { userId } });
  const threadCount = await prisma.communityThread.count({ where: { authorId: userId } });

  const earnedBadges: string[] = [];
  if (completedCount >= 1) earnedBadges.push('first_article');
  if (maxStreak >= 7) earnedBadges.push('streak_7');
  if (maxStreak >= 30) earnedBadges.push('streak_30');
  if (categoryCount >= 3) earnedBadges.push('book_explorer');
  if (completedCount >= 50) earnedBadges.push('top_reader');
  if (commentCount >= 5) earnedBadges.push('reviewer');
  if (threadCount >= 3) earnedBadges.push('community_helper');

  const existingBadges = await prisma.badge.findMany({
    where: { userId },
    select: { badgeKey: true },
  });
  const existingKeys = new Set(existingBadges.map((b) => b.badgeKey));

  for (const badgeKey of earnedBadges) {
    if (!existingKeys.has(badgeKey)) {
      const def = BADGE_DEFS[badgeKey];
      await prisma.badge.create({
        data: {
          userId,
          badgeKey,
          title: def.title,
          description: def.description,
          icon: def.icon,
        },
      });
    }
  }
}

// ─── Get badges ─────────────────────────────────────────────────────────────

export async function getBadges(userId: string, reEvaluate = false): Promise<BadgeInfo[]> {
  if (reEvaluate) {
    await evaluateBadges(userId);
  }

  const earnedBadges = await prisma.badge.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  const earnedMap = new Map(earnedBadges.map((b) => [b.badgeKey, b]));

  // Compute progress for each badge
  const completedCount = await prisma.readingHistory.count({
    where: { userId, progress: { gte: 100 } },
  });
  const rawDays = await prisma.readingHistory.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const uniqueDays = [...new Set(rawDays.map((r) => formatDateLocal(r.createdAt)))].sort();
  let maxStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < uniqueDays.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diff === 1) currentStreak++;
      else currentStreak = 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  const historyArticles = await prisma.readingHistory.findMany({
    where: { userId, contentType: 'article' },
    select: { contentId: true },
  });
  const articleIds = historyArticles.map((h) => h.contentId);
  let categoryCount = 0;
  if (articleIds.length > 0) {
    const cats = await prisma.article.groupBy({
      by: ['category'],
      where: { id: { in: articleIds } },
    });
    categoryCount = cats.length;
  }

  const commentCount = await prisma.comment.count({ where: { userId } });
  const threadCount = await prisma.communityThread.count({ where: { authorId: userId } });

  return Object.entries(BADGE_DEFS).map(([badgeKey, def]) => {
    const earned = earnedMap.get(badgeKey);
    let progress = 0;
    switch (badgeKey) {
      case 'first_article':
        progress = Math.min(100, Math.round((completedCount / 1) * 100));
        break;
      case 'streak_7':
        progress = Math.min(100, Math.round((maxStreak / 7) * 100));
        break;
      case 'streak_30':
        progress = Math.min(100, Math.round((maxStreak / 30) * 100));
        break;
      case 'book_explorer':
        progress = Math.min(100, Math.round((categoryCount / 3) * 100));
        break;
      case 'top_reader':
        progress = Math.min(100, Math.round((completedCount / 50) * 100));
        break;
      case 'reviewer':
        progress = Math.min(100, Math.round((commentCount / 5) * 100));
        break;
      case 'community_helper':
        progress = Math.min(100, Math.round((threadCount / 3) * 100));
        break;
      default:
        progress = earned ? 100 : 0;
    }

    return {
      badgeKey,
      title: def.title,
      description: def.description,
      icon: def.icon,
      earned: !!earned,
      earnedAt: earned?.createdAt.toISOString() || null,
      progress: earned ? 100 : progress,
    };
  });
}

// ─── Goals ──────────────────────────────────────────────────────────────────

const weeklyGoals = new Map<string, { target: number; progress: number }>();
const monthlyGoals = new Map<string, { target: number; progress: number }>();

export async function getGoals(userId: string): Promise<{ weekly: GoalInfo; monthly: GoalInfo }> {
  const weekKey = getWeekKey();
  const monthKey = getMonthKey();

  const weekGoal = weeklyGoals.get(`${userId}_${weekKey}`) || { target: 5, progress: 0 };
  const weekProgress = await prisma.readingHistory.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
  });
  weeklyGoals.set(`${userId}_${weekKey}`, { target: weekGoal.target, progress: weekProgress });

  const monthGoal = monthlyGoals.get(`${userId}_${monthKey}`) || { target: 20, progress: 0 };
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthProgress = await prisma.readingHistory.count({
    where: { userId, createdAt: { gte: monthStart } },
  });
  monthlyGoals.set(`${userId}_${monthKey}`, { target: monthGoal.target, progress: monthProgress });

  return {
    weekly: {
      type: 'weekly',
      target: weekGoal.target,
      progress: weekProgress,
      percentage: Math.min(100, Math.round((weekProgress / Math.max(weekGoal.target, 1)) * 100)),
    },
    monthly: {
      type: 'monthly',
      target: monthGoal.target,
      progress: monthProgress,
      percentage: Math.min(100, Math.round((monthProgress / Math.max(monthGoal.target, 1)) * 100)),
    },
  };
}

export async function updateGoal(
  userId: string,
  type: 'weekly' | 'monthly',
  target: number
): Promise<GoalInfo> {
  const weekKey = getWeekKey();
  const monthKey = getMonthKey();

  if (type === 'weekly') {
    const progress = await prisma.readingHistory.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
    });
    weeklyGoals.set(`${userId}_${weekKey}`, { target, progress });
    return {
      type: 'weekly',
      target,
      progress,
      percentage: Math.min(100, Math.round((progress / Math.max(target, 1)) * 100)),
    };
  } else {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const progress = await prisma.readingHistory.count({
      where: { userId, createdAt: { gte: monthStart } },
    });
    monthlyGoals.set(`${userId}_${monthKey}`, { target, progress });
    return {
      type: 'monthly',
      target,
      progress,
      percentage: Math.min(100, Math.round((progress / Math.max(target, 1)) * 100)),
    };
  }
}

// ─── Completed series ───────────────────────────────────────────────────────

export async function getCompletedSeries(userId: string) {
  const novelChapters = await prisma.chapter.findMany({
    select: {
      id: true,
      novelId: true,
      novel: { select: { id: true, title: true } },
    },
  });

  const novelMap = new Map<string, { novelId: string; novelTitle: string; chapterIds: string[] }>();
  novelChapters.forEach((ch) => {
    if (!novelMap.has(ch.novelId)) {
      novelMap.set(ch.novelId, {
        novelId: ch.novelId,
        novelTitle: ch.novel.title,
        chapterIds: [],
      });
    }
    novelMap.get(ch.novelId)!.chapterIds.push(ch.id);
  });

  const completedChapters = await prisma.readingHistory.findMany({
    where: { userId, contentType: 'chapter', progress: { gte: 100 } },
    select: { contentId: true },
  });
  const completedChapterIds = new Set(completedChapters.map((h) => h.contentId));

  const completed: Array<{ novelId: string; novelTitle: string; completedAt: Date }> = [];
  for (const [, entry] of novelMap) {
    if (
      entry.chapterIds.length > 0 &&
      entry.chapterIds.every((cid) => completedChapterIds.has(cid))
    ) {
      completed.push({
        novelId: entry.novelId,
        novelTitle: entry.novelTitle,
        completedAt: new Date(),
      });
    }
  }

  return completed;
}

// ─── Saved articles ─────────────────────────────────────────────────────────

export async function getSavedArticles(userId: string) {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    include: {
      article: { select: { id: true, title: true, category: true, readingTime: true, slug: true } },
      novel: { select: { id: true, title: true, slug: true } },
      chapter: { select: { id: true, title: true } },
      book: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return bookmarks.map((b) => ({
    id: b.id,
    contentType: b.articleId ? 'article' : b.novelId ? 'novel' : b.chapterId ? 'chapter' : 'book',
    contentId: b.articleId || b.novelId || b.chapterId || b.bookId,
    title:
      b.article?.title || b.novel?.title || b.chapter?.title || b.book?.title || 'Untitled',
    savedAt: b.createdAt.toISOString(),
  }));
}

