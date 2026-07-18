import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

// Content type as union
type ContentType = 'article' | 'novel' | 'chapter' | 'book';

// Helper to get ID field name from content type
function getIdField(type: ContentType): string {
  return `${type}Id`;
}

// Helper to get count field name
function getCountField(type: ContentType): string {
  if (type === 'article') return 'claps';
  return `${type}s_likes`;
}

// ============================================
// LIKE OPERATIONS
// ============================================

export async function toggleLike(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { type, id } = req.body as { type: ContentType; id: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!type || !id) {
    return res.status(400).json({ error: 'Missing type or id' });
  }

  const idField = getIdField(type);

  try {
    // Check if like already exists
    const existing = await prisma.like.findFirst({
      where: { userId, [idField]: id }
    });

    let liked = false;

    if (existing) {
      // Unlike (delete)
      await prisma.like.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      // Like (create)
      await prisma.like.create({
        data: { userId, [idField]: id }
      });
      liked = true;
    }

    // Get updated count
    const count = await prisma.like.count({
      where: { [idField]: id }
    });

    res.json({ liked, count });
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
}

export async function getLikeStatus(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { type, id } = req.query as { type: ContentType; id: string };

  if (!type || !id) {
    return res.status(400).json({ error: 'Missing type or id' });
  }

  const idField = getIdField(type);

  try {
    const liked = !!userId ? await prisma.like.findFirst({
      where: { userId, [idField]: id }
    }) : false;

    const count = await prisma.like.count({
      where: { [idField]: id }
    });

    res.json({ liked, count });
  } catch (error) {
    console.error('Get like status error:', error);
    res.status(500).json({ error: 'Failed to get like status' });
  }
}

// ============================================
// BOOKMARK OPERATIONS
// ============================================

export async function toggleBookmark(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { type, id } = req.body as { type: ContentType; id: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!type || !id) {
    return res.status(400).json({ error: 'Missing type or id' });
  }

  const idField = getIdField(type);

  try {
    const existing = await prisma.bookmark.findFirst({
      where: { userId, [idField]: id }
    });

    let bookmarked = false;

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      bookmarked = false;
    } else {
      await prisma.bookmark.create({
        data: { userId, [idField]: id }
      });
      bookmarked = true;
    }

    const count = await prisma.bookmark.count({
      where: { [idField]: id }
    });

    res.json({ bookmarked, count });
  } catch (error) {
    console.error('Bookmark toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
}

export async function getBookmarkStatus(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { type, id } = req.query as { type: ContentType; id: string };

  if (!type || !id) {
    return res.status(400).json({ error: 'Missing type or id' });
  }

  const idField = getIdField(type);

  try {
    const bookmarked = !!userId ? await prisma.bookmark.findFirst({
      where: { userId, [idField]: id }
    }) : false;

    const count = await prisma.bookmark.count({
      where: { [idField]: id }
    });

    res.json({ bookmarked, count });
  } catch (error) {
    console.error('Get bookmark status error:', error);
    res.status(500).json({ error: 'Failed to get bookmark status' });
  }
}

export async function getUserBookmarks(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        article: true,
        novel: true,
        chapter: true,
        book: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by content type
    const grouped = {
      articles: bookmarks.filter(b => b.articleId).map(b => b.article),
      novels: bookmarks.filter(b => b.novelId).map(b => b.novel),
      chapters: bookmarks.filter(b => b.chapterId).map(b => b.chapter),
      books: bookmarks.filter(b => b.bookId).map(b => b.book)
    };

    res.json(grouped);
  } catch (error) {
    console.error('Get user bookmarks error:', error);
    res.status(500).json({ error: 'Failed to get bookmarks' });
  }
}

// ============================================
// RATING OPERATIONS
// ============================================

export async function setRating(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { type, id, value } = req.body as { type: ContentType; id: string; value: number };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!type || !id || value === undefined) {
    return res.status(400).json({ error: 'Missing type, id, or value' });
  }

  if (value < 1 || value > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const idField = getIdField(type);

  try {
    // Check if exists first
    const existing = await prisma.rating.findFirst({
      where: { userId, [idField]: id }
    });

    let rating;
    if (existing) {
      rating = await prisma.rating.update({
        where: { id: existing.id },
        data: { value }
      });
    } else {
      rating = await prisma.rating.create({
        data: { userId, [idField]: id, value }
      });
    }

    // Get average
    const agg = await prisma.rating.aggregate({
      where: { [idField]: id },
      _avg: { value: true },
      _count: { value: true }
    });

    res.json({
      userRating: rating.value,
      average: agg._avg.value || 0,
      count: agg._count.value || 0
    });
  } catch (error) {
    console.error('Rating set error:', error);
    res.status(500).json({ error: 'Failed to set rating' });
  }
}

export async function getRatingStatus(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { type, id } = req.query as { type: ContentType; id: string };

  if (!type || !id) {
    return res.status(400).json({ error: 'Missing type or id' });
  }

  const idField = getIdField(type);

  try {
    const userRating = userId ? await prisma.rating.findFirst({
      where: { userId, [idField]: id }
    }) : null;

    const agg = await prisma.rating.aggregate({
      where: { [idField]: id },
      _avg: { value: true },
      _count: { value: true }
    });

    res.json({
      userRating: userRating?.value || null,
      average: agg._avg.value || 0,
      count: agg._count.value || 0
    });
  } catch (error) {
    console.error('Get rating status error:', error);
    res.status(500).json({ error: 'Failed to get rating status' });
  }
}

// ============================================
// COMMENT OPERATIONS
// ============================================

export async function getComments(req: Request, res: Response) {
  const { type, id } = req.query as { type: ContentType; id: string };
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!type || !id) {
    return res.status(400).json({ error: 'Missing type or id' });
  }

  const idField = getIdField(type);

  try {
    const where = { [idField]: id, parentId: null };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          replies: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
            orderBy: { createdAt: 'asc' }
          },
          user: { select: { id: true, name: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.comment.count({ where })
    ]);

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
}

export async function createComment(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { type, id, content, parentId } = req.body as {
    type: ContentType;
    id: string;
    content: string;
    parentId?: string;
  };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!type || !id || !content) {
    return res.status(400).json({ error: 'Missing type, id, or content' });
  }

  if (!content.trim()) {
    return res.status(400).json({ error: 'Content cannot be empty' });
  }

  const idField = getIdField(type);

  try {
    const comment = await prisma.comment.create({
      data: {
        userId,
        content: content.trim(),
        [idField]: id,
        parentId: parentId || null
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
}

export async function updateComment(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { id, content } = req.body as { id: string; content: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id || !content) {
    return res.status(400).json({ error: 'Missing id or content' });
  }

  try {
    const existing = await prisma.comment.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { content: content.trim() },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.json(comment);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
}

export async function deleteComment(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { id } = req.body as { id: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  try {
    const existing = await prisma.comment.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Delete (cascades to replies)
    await prisma.comment.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}

export async function moderateComment(req: Request, res: Response) {
  const user = req.user as { role?: string } | null;
  const { id, approved } = req.body as { id: string; approved: boolean };

  // Admin check
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  if (!id || approved === undefined) {
    return res.status(400).json({ error: 'Missing id or approved' });
  }

  try {
    const comment = await prisma.comment.update({
      where: { id },
      data: { approved }
    });

    res.json(comment);
  } catch (error) {
    console.error('Moderate comment error:', error);
    res.status(500).json({ error: 'Failed to moderate comment' });
  }
}

// ============================================
// REACTION OPERATIONS (المعدلة)
// ============================================

const VALID_EMOJIS = ['love', 'fire', 'funny', 'sad', 'wow', 'clap', 'mind_blown', 'excellent'] as const;
type EmojiType = typeof VALID_EMOJIS[number];

export async function setReaction(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { contentId, contentType, emoji } = req.body as {
    contentId: string;
    contentType: ContentType;
    emoji: string;
  };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!contentId || !contentType || !emoji) {
    return res.status(400).json({ error: 'Missing contentId, contentType, or emoji' });
  }

  if (emoji !== 'remove' && !VALID_EMOJIS.includes(emoji as EmojiType)) {
    return res.status(400).json({ error: 'Invalid emoji' });
  }

  try {
    // Check if reaction exists
    const existing = await prisma.reaction.findFirst({
      where: { userId, contentId }
    });

    let reaction;
    if (existing) {
      // Update or remove
      if (emoji === 'remove') {
        await prisma.reaction.delete({ where: { id: existing.id } });
        reaction = null;
      } else {
        reaction = await prisma.reaction.update({
          where: { id: existing.id },
          data: { emoji, contentType }
        });
      }
    } else if (emoji !== 'remove') {
      reaction = await prisma.reaction.create({
        data: { userId, contentId, contentType, emoji }
      });
    }

    // Get updated counts
    const counts = await prisma.reaction.groupBy({
      by: ['emoji'],
      where: { contentId },
      _count: { emoji: true }
    });

    const emojiCounts: Record<string, number> = {};
    let maxEmoji = '';
    let maxCount = 0;
    for (const c of counts) {
      emojiCounts[c.emoji] = c._count.emoji;
      if (c._count.emoji > maxCount) {
        maxCount = c._count.emoji;
        maxEmoji = c.emoji;
      }
    }

    res.json({
      userReaction: reaction?.emoji || null,
      counts: emojiCounts,
      topReaction: maxEmoji
    });
  } catch (error: any) {
    console.error('Set reaction error:', error);
    // 💡 تم التعديل هنا لتمرير تفاصيل الخطأ مباشرة للمتصفح كشفاً للسبب
    res.status(500).json({ 
      error: 'Failed to set reaction', 
      details: error?.message || String(error) 
    });
  }
}

export async function getReactionStatus(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { contentId } = req.query as { contentId: string };

  if (!contentId) {
    return res.status(400).json({ error: 'Missing contentId' });
  }

  try {
    const userReaction = userId ? await prisma.reaction.findFirst({
      where: { userId, contentId }
    }) : null;

    const counts = await prisma.reaction.groupBy({
      by: ['emoji'],
      where: { contentId },
      _count: { emoji: true }
    });

    const emojiCounts: Record<string, number> = {};
    let maxEmoji = '';
    let maxCount = 0;
    for (const c of counts) {
      emojiCounts[c.emoji] = c._count.emoji;
      if (c._count.emoji > maxCount) {
        maxCount = c._count.emoji;
        maxEmoji = c.emoji;
      }
    }

    res.json({
      userReaction: userReaction?.emoji || null,
      counts: emojiCounts,
      topReaction: maxEmoji
    });
  } catch (error) {
    console.error('Get reaction error:', error);
    res.status(500).json({ error: 'Failed to get reaction' });
  }
}

// ============================================
// POLL OPERATIONS
// ============================================

export async function createPoll(req: Request, res: Response) {
  const user = req.user as { id?: string; role?: string } | null;
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { contentId, contentType, chapterId, question, type = 'single', isAnonymous = false, isPublic = true, closesAt, options } = req.body as {
    contentId: string;
    contentType: ContentType;
    chapterId?: string;
    question: string;
    type?: 'single' | 'multiple';
    isAnonymous?: boolean;
    isPublic?: boolean;
    closesAt?: string;
    options: string[];
  };

  if (!contentId || !contentType || !question || !options || options.length < 2) {
    return res.status(400).json({ error: 'Missing required fields or need at least 2 options' });
  }

  try {
    const poll = await prisma.poll.create({
      data: {
        contentId,
        contentType,
        chapterId: chapterId || null,
        question,
        type,
        isAnonymous,
        isPublic,
        closesAt: closesAt ? new Date(closesAt) : null,
        createdBy: userId,
        options: {
          create: options.map(text => ({ text }))
        }
      },
      include: {
        options: true
      }
    });

    res.json(poll);
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
}

export async function getPolls(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { contentId, contentType, chapterId } = req.query as { contentId: string; contentType: ContentType; chapterId?: string };

  if (!contentId || !contentType) {
    return res.status(400).json({ error: 'Missing contentId or contentType' });
  }

  try {
    const where: Record<string, unknown> = { contentId, contentType };
    if (chapterId) {
      where.chapterId = chapterId;
    }

    const polls = await prisma.poll.findMany({
      where,
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(polls);
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ error: 'Failed to get polls' });
  }
}

export async function votePoll(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { pollId, optionIds } = req.body as { pollId: string; optionIds: string[] };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!pollId || !optionIds || optionIds.length === 0) {
    return res.status(400).json({ error: 'Missing pollId or optionIds' });
  }

  try {
    // Get poll info
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Validate poll type
    if (poll.type === 'single' && optionIds.length > 1) {
      return res.status(400).json({ error: 'Single choice poll - select only one option' });
    }

    // Delete existing votes for this user on this poll
    await prisma.pollVote.deleteMany({
      where: { pollId, userId }
    });

    // Create new votes
    await prisma.pollVote.createMany({
      data: optionIds.map(optionId => ({
        pollId,
        optionId,
        userId: poll.isAnonymous ? null : userId
      }))
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Vote poll error:', error);
    res.status(500).json({ error: 'Failed to vote' });
  }
}

export async function changeVote(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { pollId, optionId } = req.body as { pollId: string; optionId: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!pollId || !optionId) {
    return res.status(400).json({ error: 'Missing pollId or optionId' });
  }

  try {
    // Get poll to check type
    const poll = await prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Delete user's votes on this poll
    await prisma.pollVote.deleteMany({
      where: { pollId, userId }
    });

    // Create new vote
    await prisma.pollVote.create({
      data: {
        pollId,
        optionId,
        userId: poll.isAnonymous ? null : userId
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Change vote error:', error);
    res.status(500).json({ error: 'Failed to change vote' });
  }
}

export async function deletePoll(req: Request, res: Response) {
  const user = req.user as { id?: string; role?: string } | null;
  const userId = user?.id;
  const { id } = req.body as { id: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  try {
    const poll = await prisma.poll.findUnique({
      where: { id }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Check ownership or admin
    if (poll.createdBy !== userId && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.poll.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({ error: 'Failed to delete poll' });
  }
}

export async function getPollResults(req: Request, res: Response) {
  const { pollId } = req.query as { pollId: string };

  if (!pollId) {
    return res.status(400).json({ error: 'Missing pollId' });
  }

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Calculate percentages
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt._count.votes, 0);
    const results = poll.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      votes: opt._count.votes,
      percentage: totalVotes > 0 ? Math.round((opt._count.votes / totalVotes) * 100) : 0
    }));

    res.json({
      pollId: poll.id,
      question: poll.question,
      type: poll.type,
      isPublic: poll.isPublic,
      totalVotes,
      results: poll.isPublic ? results : undefined
    });
  } catch (error) {
    console.error('Get poll results error:', error);
    res.status(500).json({ error: 'Failed to get poll results' });
  }
}

// Quote functions - reuse existing engagement pattern
export async function saveQuote(req: Request, res: Response) {
  const userId = (req.user as { id: string })?.id;
  const { contentId, contentType, selectedText, startOffset, endOffset } = req.body as {
    contentId: string;
    contentType: string;
    selectedText: string;
    startOffset?: number;
    endOffset?: number;
  };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!contentId || !contentType || !selectedText) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const quote = await prisma.quote.create({
      data: {
        userId,
        contentId,
        contentType,
        selectedText,
        startOffset: startOffset ?? null,
        endOffset: endOffset ?? null
      }
    });

    res.json(quote);
  } catch (error: unknown) {
    console.error('Save quote error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ error: 'Quote already saved' });
    }
    res.status(500).json({ error: 'Failed to save quote' });
  }
}

export async function getQuotes(req: Request, res: Response) {
  const userId = (req.user as { id: string })?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const quotes = await prisma.quote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } }
      }
    });

    // Get content titles for each quote
    const quotesWithContent = await Promise.all(
      quotes.map(async (quote) => {
        let contentTitle = 'Unknown';
        let contentSlug = '';
        let authorName = '';

        if (quote.contentType === 'article') {
          const article = await prisma.article.findUnique({
            where: { id: quote.contentId },
            select: { title: true, slug: true, authorName: true }
          });
          if (article) {
            contentTitle = article.title;
            contentSlug = article.slug;
            authorName = article.authorName || '';
          }
        } else if (quote.contentType === 'novel') {
          const novel = await prisma.novel.findUnique({
            where: { id: quote.contentId },
            select: { title: true, slug: true, authorName: true }
          });
          if (novel) {
            contentTitle = novel.title;
            contentSlug = novel.slug;
            authorName = novel.authorName || '';
          }
        } else if (quote.contentType === 'chapter') {
          const chapter = await prisma.chapter.findUnique({
            where: { id: quote.contentId },
            select: { title: true, number: true, novelId: true }
          });
          if (chapter) {
            contentTitle = `Chapter ${chapter.number}: ${chapter.title}`;
            contentSlug = chapter.novelId;
          }
        }

        return {
          id: quote.id,
          contentId: quote.contentId,
          contentType: quote.contentType,
          selectedText: quote.selectedText,
          startOffset: quote.startOffset,
          endOffset: quote.endOffset,
          contentTitle,
          authorName,
          createdAt: quote.createdAt
        };
      })
    );

    res.json({ quotes: quotesWithContent });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: 'Failed to get quotes' });
  }
}

export async function deleteQuote(req: Request, res: Response) {
  const userId = (req.user as { id: string })?.id;
  const { quoteId } = req.body as { quoteId: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!quoteId) {
    return res.status(400).json({ error: 'Missing quoteId' });
  }

  try {
    await prisma.quote.delete({
      where: {
        id: quoteId,
        userId
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
}

// ============================================
// FOLLOW OPERATIONS
// ============================================

export async function toggleFollow(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { followingId } = req.body as { followingId: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!followingId) {
    return res.status(400).json({ error: 'Missing followingId' });
  }

  if (userId === followingId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    const existing = await prisma.follow.findFirst({
      where: { followerId: userId, followingId }
    });

    let following = false;

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      following = false;
    } else {
      await prisma.follow.create({
        data: { followerId: userId, followingId }
      });
      following = true;
    }

    const followerCount = await prisma.follow.count({
      where: { followingId }
    });

    res.json({ following, followerCount });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({ error: 'Failed to toggle follow' });
  }
}

export async function getFollowStatus(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { userId: targetUserId } = req.query as { userId: string };

  if (!targetUserId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const following = !!userId ? await prisma.follow.findFirst({
      where: { followerId: userId, followingId: targetUserId }
    }) : false;

    const followerCount = await prisma.follow.count({
      where: { followingId: targetUserId }
    });

    const followingCount = !!userId ? await prisma.follow.count({
      where: { followerId: targetUserId }
    }) : 0;

    res.json({ following, followerCount, followingCount });
  } catch (error) {
    console.error('Get follow status error:', error);
    res.status(500).json({ error: 'Failed to get follow status' });
  }
}

export async function getFollowers(req: Request, res: Response) {
  const { userId } = req.query as { userId: string };

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.json({ followers: followers.map(f => f.user) });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
}

export async function getFollowing(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.json({ following: following.map(f => f.following) });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to get following' });
  }
}

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

export async function getNotifications(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    res.json({
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
}

export async function markNotificationRead(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { id } = req.body as { id: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }

  try {
    await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications read' });
  }
}

export async function getNotificationSettings(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { userId }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
}

export async function updateNotificationSettings(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const updates = req.body as {
    likes?: boolean;
    comments?: boolean;
    replies?: boolean;
    reactions?: boolean;
    pollVotes?: boolean;
    newChapter?: boolean;
  };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: updates,
      create: { userId, ...updates }
    });

    res.json(settings);
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
}

// ============================================
// COMMUNITY BOOKMARK OPERATIONS
// ============================================

export async function toggleCommunityBookmark(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { threadId } = req.body as { threadId: string };

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!threadId) {
    return res.status(400).json({ error: 'Missing threadId' });
  }

  try {
    const existing = await prisma.communityBookmark.findFirst({
      where: { userId, threadId }
    });

    let bookmarked = false;

    if (existing) {
      await prisma.communityBookmark.delete({ where: { id: existing.id } });
      bookmarked = false;
    } else {
      await prisma.communityBookmark.create({
        data: { userId, threadId }
      });
      bookmarked = true;
    }

    const count = await prisma.communityBookmark.count({
      where: { threadId }
    });

    res.json({ bookmarked, count });
  } catch (error) {
    console.error('Toggle community bookmark error:', error);
    res.status(500).json({ error: 'Failed to toggle community bookmark' });
  }
}

export async function getCommunityBookmarkStatus(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;
  const { threadId } = req.query as { threadId: string };

  if (!threadId) {
    return res.status(400).json({ error: 'Missing threadId' });
  }

  try {
    const bookmarked = !!userId ? await prisma.communityBookmark.findFirst({
      where: { userId, threadId }
    }) : false;

    const count = await prisma.communityBookmark.count({
      where: { threadId }
    });

    res.json({ bookmarked, count });
  } catch (error) {
    console.error('Get community bookmark status error:', error);
    res.status(500).json({ error: 'Failed to get bookmark status' });
  }
}

export async function getUserCommunityBookmarks(req: Request, res: Response) {
  const user = req.user as { id?: string } | null;
  const userId = user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const bookmarks = await prisma.communityBookmark.findMany({
      where: { userId },
      include: {
        thread: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ bookmarks: bookmarks.map(b => b.thread) });
  } catch (error) {
    console.error('Get user community bookmarks error:', error);
    res.status(500).json({ error: 'Failed to get community bookmarks' });
  }
}