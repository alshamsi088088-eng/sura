import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

interface AuthUser {
  id: string;
  role: string;
}

// Get author analytics overview
export async function getAuthorOverview(req: Request, res: Response) {
  const user = req.user as AuthUser | undefined;
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get author's content IDs
    const articles = await prisma.article.findMany({
      where: { authorId: userId },
      select: { id: true }
    });
    const novels = await prisma.novel.findMany({
      where: { authorId: userId },
      select: { id: true }
    });
    const articleIds = articles.map((a) => a.id);
    const novelIds = novels.map((n) => n.id);

    // Get chapters for author's novels
    const chapters = await prisma.chapter.findMany({
      where: { novel: { authorId: userId } },
      select: { id: true }
    });
    const chapterIds = chapters.map((c) => c.id);

    // Views sum from articles
    const viewsResult = await prisma.article.aggregate({
      where: { authorId: userId },
      _sum: { views: true }
    });

    // Likes count
    const likesResult = await prisma.like.count({
      where: {
        OR: [
          { articleId: { in: articleIds } },
          { novelId: { in: novelIds } },
          { chapterId: { in: chapterIds } }
        ]
      }
    });

    // Bookmarks count
    const bookmarksResult = await prisma.bookmark.count({
      where: {
        OR: [
          { articleId: { in: articleIds } },
          { novelId: { in: novelIds } }
        ]
      }
    });

    // Ratings count
    const ratingsResult = await prisma.rating.count({
      where: {
        OR: [
          { articleId: { in: articleIds } },
          { novelId: { in: novelIds } },
          { chapterId: { in: chapterIds } }
        ]
      }
    });

    // Comments count
    const commentsResult = await prisma.comment.count({
      where: {
        OR: [
          { articleId: { in: articleIds } },
          { novelId: { in: novelIds } },
          { chapterId: { in: chapterIds } }
        ],
        parentId: null
      }
    });

    res.json({
      views: viewsResult._sum.views || 0,
      likes: likesResult,
      bookmarks: bookmarksResult,
      ratings: ratingsResult,
      comments: commentsResult,
      articles: articleIds.length,
      novels: novelIds.length,
      chapters: chapterIds.length
    });
  } catch (error) {
    console.error('Author overview error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
}

// Get top content
export async function getTopContent(req: Request, res: Response) {
  const user = req.user as AuthUser | undefined;
  const userId = user?.id;
  const { type } = req.query as { type: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (type === 'article' || !type) {
      const articles = await prisma.article.findMany({
        where: { authorId: userId },
        select: { id: true, title: true, views: true },
        orderBy: { views: 'desc' },
        take: 5
      });
      return res.json(articles.map(a => ({ id: a.id, title: a.title, views: a.views, likes: 0 })));
    }

    if (type === 'novel') {
      const novels = await prisma.novel.findMany({
        where: { authorId: userId },
        select: { id: true, title: true, createdAt: true },
        take: 5
      });
      // Get likes count for each novel
      const withLikes = await Promise.all(novels.map(async (n) => {
        const likes = await prisma.like.count({
          where: { novelId: n.id }
        });
        return { id: n.id, title: n.title, views: 0, likes };
      }));
      return res.json(withLikes);
    }

    if (type === 'chapter') {
      const chapters = await prisma.chapter.findMany({
        where: { novel: { authorId: userId } },
        select: { id: true, title: true },
        take: 5
      });
      const withLikes = await Promise.all(chapters.map(async (c) => {
        const likes = await prisma.like.count({ where: { chapterId: c.id } });
        return { id: c.id, title: c.title, views: 0, likes };
      }));
      return res.json(withLikes);
    }

    res.json([]);
  } catch (error) {
    console.error('Top content error:', error);
    res.status(500).json({ error: 'Failed to get top content' });
  }
}

// Get reaction breakdown
export async function getReactionBreakdown(req: Request, res: Response) {
  const user = req.user as AuthUser | undefined;
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get author's content IDs for reaction query
    const articles = await prisma.article.findMany({
      where: { authorId: userId },
      select: { id: true }
    });
    const novels = await prisma.novel.findMany({
      where: { authorId: userId },
      select: { id: true }
    });
    const chapters = await prisma.chapter.findMany({
      where: { novel: { authorId: userId } },
      select: { id: true }
    });

    const articleIds = articles.map(a => a.id);
    const novelIds = novels.map(n => n.id);
    const chapterIds = chapters.map(c => c.id);

    const contentIds = [...articleIds, ...novelIds, ...chapterIds];

    if (contentIds.length === 0) {
      return res.json({});
    }

    const counts = await prisma.reaction.groupBy({
      by: ['emoji'],
      where: { contentId: { in: contentIds } },
      _count: true
    });

    const total = counts.reduce((sum, c) => sum + c._count, 0);
    const breakdown: Record<string, number> = {};
    counts.forEach(c => {
      breakdown[c.emoji] = total > 0 ? Math.round((c._count / total) * 100) : 0;
    });

    res.json(breakdown);
  } catch (error) {
    console.error('Reaction breakdown error:', error);
    res.status(500).json({ error: 'Failed to get reactions' });
  }
}

// Get daily trend (last 7 days)
export async function getDailyTrend(req: Request, res: Response) {
  const user = req.user as AuthUser | undefined;
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const articles = await prisma.article.findMany({
      where: { authorId: userId },
      select: { id: true, createdAt: true }
    });

    if (articles.length === 0) {
      return res.json([]);
    }

    // Aggregate by day
    const byDay: Record<string, number> = {};
    articles.forEach(a => {
      const date = a.createdAt.toISOString().slice(0, 10);
      byDay[date] = (byDay[date] || 0) + 1;
    });

    // Fill in missing days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      result.push({ date: dateStr, articles: byDay[dateStr] || 0, views: 0 });
    }

    res.json(result);
  } catch (error) {
    console.error('Daily trend error:', error);
    res.status(500).json({ error: 'Failed to get trend' });
  }
}

// Get weekly trend (last 4 weeks)
export async function getWeeklyTrend(req: Request, res: Response) {
  const user = req.user as AuthUser | undefined;
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const articles = await prisma.article.findMany({
      where: { authorId: userId },
      select: { createdAt: true }
    });

    // Aggregate by week
    const byWeek: Record<string, number> = {};
    articles.forEach(a => {
      const d = new Date(a.createdAt);
      const weekStart = new Date(d.setDate(d.getDate() - d.getDay())).toISOString().slice(0, 10);
      byWeek[weekStart] = (byWeek[weekStart] || 0) + 1;
    });

    const result = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const weekStart = new Date(d.setDate(d.getDate() - d.getDay())).toISOString().slice(0, 10);
      result.push({ week: weekStart, articles: byWeek[weekStart] || 0 });
    }

    res.json(result);
  } catch (error) {
    console.error('Weekly trend error:', error);
    res.status(500).json({ error: 'Failed to get trend' });
  }
}