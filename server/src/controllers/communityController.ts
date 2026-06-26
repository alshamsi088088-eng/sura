import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = ['Discussion', 'Theory', 'Question', 'Character', 'Quote', 'Prediction', 'Fan Content'];

export async function createThread(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { contentId, contentType, category, title, body, parentId } = req.body;

    if (!category || !CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Body is required' });
    }

    const thread = await prisma.communityThread.create({
      data: {
        authorId: userId,
        contentId: contentId || null,
        contentType: contentType || null,
        category,
        title: title.trim(),
        body: body.trim(),
        parentId: parentId || null,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.status(201).json(thread);
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
}

export async function getThreads(req: Request, res: Response) {
  try {
    const { contentId, contentType, category, sort = 'latest', search, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (contentId && contentType) {
      where.contentId = contentId;
      where.contentType = contentType;
    }
    if (category && category !== 'All') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { body: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Get all thread IDs first for custom sorting
    const allThreads = await prisma.communityThread.findMany({
      where,
      select: { id: true },
    });
    const threadIds = allThreads.map(t => t.id);

    if (threadIds.length === 0) {
      return res.json({ threads: [], total: 0, page: 1, totalPages: 1 });
    }

    // Fetch threads with counts for likes and comments
    const threadsData = await prisma.communityThread.findMany({
      where: { id: { in: threadIds } },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        _count: { select: { replies: true, likes: true, comments: true } },
      },
    });

    // Add like and comment counts to threads
    const threadsWithCounts = threadsData.map(t => ({
      ...t,
      replyCount: t._count.replies,
      likeCount: t._count.likes,
      commentCount: t._count.comments,
    }));

    // Sort based on sort parameter
    let sortedThreads = [...threadsWithCounts];
    if (sort === 'most_liked') {
      sortedThreads.sort((a, b) => b.likeCount - a.likeCount);
    } else if (sort === 'most_commented') {
      sortedThreads.sort((a, b) => b.commentCount - a.commentCount);
    } else if (sort === 'oldest') {
      sortedThreads.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      // default 'latest' - already sorted by createdAt desc
      sortedThreads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Apply pagination
    const paginatedThreads = sortedThreads.slice(skip, skip + take);
    const total = threadIds.length;

    res.json({
      threads: paginatedThreads,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / take),
    });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
}

export async function getThread(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const thread = await prisma.communityThread.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json(thread);
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
}

export async function deleteThread(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const thread = await prisma.communityThread.findUnique({
      where: { id },
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    if (thread.authorId !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.communityThread.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete thread error:', error);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
}

export async function getCategories(_req: Request, res: Response) {
  res.json({ categories: CATEGORIES });
}