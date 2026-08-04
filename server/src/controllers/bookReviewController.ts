import type { Request, Response } from 'express';
import * as bookReviewService from '../services/bookReviewService.js';
import { prisma } from '../services/prisma.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getUserId(req: Request): string | undefined {
  return (req as any).user?.id;
}

function getPagination(query: any): { page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));
  return { page, limit };
}

function handleError(res: Response, error: unknown, fallback: string) {
  if (error instanceof Error) {
    return res.status(400).json({ message: error.message });
  }
  return res.status(500).json({ message: fallback });
}

// ─── Public: Get books with filters ─────────────────────────────────────────

export async function getBooks(req: Request, res: Response) {
  try {
    const { search, genre, language, rating_min, rating_max, sort } = req.query;
    const { page, limit } = getPagination(req.query);

    const books = await bookReviewService.getBooks({
      search: search as string | undefined,
      genre: genre as string | undefined,
      language: language as string | undefined,
      ratingMin: rating_min ? parseInt(rating_min as string, 10) : undefined,
      ratingMax: rating_max ? parseInt(rating_max as string, 10) : undefined,
      sort: (sort as any) || 'newest',
      page,
      limit,
    });

    return res.json(books);
  } catch (error) {
    console.error('getBooks error:', error);
    return res.status(500).json({ message: 'Failed to fetch books' });
  }
}

// ─── Public: Get single book with stats ─────────────────────────────────────

export async function getBookById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const book = await bookReviewService.getBookById(id, userId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    return res.json({ book });
  } catch (error) {
    console.error('getBookById error:', error);
    return res.status(500).json({ message: 'Failed to fetch book' });
  }
}

// ─── Public: List distinct genres ───────────────────────────────────────────

export async function getGenres(req: Request, res: Response) {
  try {
    const genres = await bookReviewService.getGenres();
    return res.json({ genres });
  } catch (error) {
    console.error('getGenres error:', error);
    return res.status(500).json({ message: 'Failed to fetch genres' });
  }
}

// ─── Public: Get reviews for a book ─────────────────────────────────────────

export async function getBookReviews(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { sort } = req.query;
    const { page, limit } = getPagination(req.query);
    const userId = getUserId(req);

    // Validate book exists
    const book = await bookReviewService.getBookById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const reviews = await bookReviewService.getBookReviews(
      id,
      (sort as any) || 'newest',
      page,
      limit,
      userId
    );

    return res.json(reviews);
  } catch (error) {
    console.error('getBookReviews error:', error);
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
}

// ─── Auth: Create a review ──────────────────────────────────────────────────

export async function createReview(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const { rating, content, title, language } = req.body;

    const review = await bookReviewService.createReview(
      userId,
      id,
      rating,
      content,
      title,
      language
    );

    return res.status(201).json({ review });
  } catch (error) {
    console.error('createReview error:', error);
    return handleError(res, error, 'Failed to create review');
  }
}

// ─── Auth: Update own review ────────────────────────────────────────────────

export async function updateReview(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { reviewId } = req.params;
    const { rating, content, title } = req.body;

    const review = await bookReviewService.updateReview(reviewId, userId, rating, content, title);
    return res.json({ review });
  } catch (error) {
    console.error('updateReview error:', error);
    return handleError(res, error, 'Failed to update review');
  }
}

// ─── Auth: Delete own review (owner or admin) ───────────────────────────────

export async function deleteReview(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { reviewId } = req.params;
    const isAdmin = (req as any).user?.role === 'admin';

    await bookReviewService.deleteReview(reviewId, userId, isAdmin);
    return res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('deleteReview error:', error);
    return handleError(res, error, 'Failed to delete review');
  }
}

// ─── Auth: Toggle helpful vote ──────────────────────────────────────────────

export async function toggleHelpful(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { reviewId } = req.params;
    const result = await bookReviewService.toggleHelpful(userId, reviewId);
    return res.json(result);
  } catch (error) {
    console.error('toggleHelpful error:', error);
    return handleError(res, error, 'Failed to toggle helpful');
  }
}

// ─── Auth: Set reading status ───────────────────────────────────────────────

export async function setReadingStatus(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const { status } = req.body;

    const result = await bookReviewService.setReadingStatus(userId, id, status);
    return res.json(result);
  } catch (error) {
    console.error('setReadingStatus error:', error);
    return handleError(res, error, 'Failed to set reading status');
  }
}

// ─── Auth: Get reading status ───────────────────────────────────────────────

export async function getReadingStatus(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const result = await bookReviewService.getReadingStatus(userId, id);
    return res.json(result);
  } catch (error) {
    console.error('getReadingStatus error:', error);
    return res.status(500).json({ message: 'Failed to get reading status' });
  }
}

// ─── Public: Reviewer stats ─────────────────────────────────────────────────

export async function getReviewerStats(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const stats = await bookReviewService.getReviewerStats(userId);

    // Also fetch reviewer profile info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true, bio: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }

    return res.json({ reviewer: user, stats });
  } catch (error) {
    console.error('getReviewerStats error:', error);
    return res.status(500).json({ message: 'Failed to fetch reviewer stats' });
  }
}

// ─── Public: Reviewer reviews (paginated) ───────────────────────────────────

export async function getReviewerReviews(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { page, limit } = getPagination(req.query);

    const reviews = await bookReviewService.getReviewerReviews(userId, page, limit);
    return res.json(reviews);
  } catch (error) {
    console.error('getReviewerReviews error:', error);
    return res.status(500).json({ message: 'Failed to fetch reviewer reviews' });
  }
}


