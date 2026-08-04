import { prisma } from './prisma.js';
import { Prisma } from '@prisma/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BookFilters {
  search?: string;
  genre?: string;
  language?: string;
  ratingMin?: number;
  ratingMax?: number;
  sort?: 'newest' | 'trending' | 'highest_rated' | 'most_reviewed' | 'most_liked';
  page?: number;
  limit?: number;
}

export interface BookListItem {
  id: string;
  title: string;
  author: string;
  summary: string;
  coverImage: string;
  genre: string | null;
  language: string | null;
  pageCount: number | null;
  publishedAt: Date | null;
  price: number;
  format: string;
  avgRating: number | null;
  reviewCount: number;
}

export interface BookDetail extends BookListItem {
  isbn?: string | null;
  stock: number;
  fileUrl?: string | null;
  previewUrl?: string | null;
  ratingDistribution: Array<{ stars: number; count: number }>;
  userRating?: number | null;
  userReadingStatus?: string | null;
}

export interface ReviewItem {
  id: string;
  rating: number;
  content: string;
  title: string | null;
  language: string;
  status: string;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  likedByUser: boolean;
  helpfulByUser: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Validation helpers ─────────────────────────────────────────────────────

function validateRating(rating: number): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be an integer between 1 and 5');
  }
}

function validateContent(content: string): void {
  if (!content || content.trim().length < 10) {
    throw new Error('Review content must be at least 10 characters');
  }
  if (content.length > 5000) {
    throw new Error('Review content must be at most 5000 characters');
  }
}

function validateTitle(title?: string): void {
  if (title && title.length > 200) {
    throw new Error('Review title must be at most 200 characters');
  }
}

// ─── Public: Get books with filters ─────────────────────────────────────────

export async function getBooks(filters: BookFilters = {}): Promise<Paginated<BookListItem>> {
  const {
    search,
    genre,
    language,
    ratingMin,
    ratingMax,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = filters;

  const where: Prisma.BookWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (genre) {
    where.genre = genre;
  }
  if (language) {
    where.language = language;
  }

  // Rating filter via sub-query on reviews
  if (ratingMin !== undefined || ratingMax !== undefined) {
    where.reviews = {
      some: {
        status: 'published',
        ...(ratingMin !== undefined ? { rating: { gte: ratingMin } } : {}),
        ...(ratingMax !== undefined ? { rating: { lte: ratingMax } } : {}),
      },
    };
  }

  const orderBy: Prisma.BookOrderByWithRelationInput[] = [];
  switch (sort) {
    case 'newest':
      orderBy.push({ createdAt: 'desc' });
      break;
    case 'trending':
    case 'most_reviewed':
      orderBy.push({ reviews: { _count: 'desc' } });
      break;
    case 'highest_rated':
      orderBy.push({ createdAt: 'desc' }); // avg computed in memory
      break;
    case 'most_liked':
      orderBy.push({ likes: { _count: 'desc' } });
      break;
    default:
      orderBy.push({ createdAt: 'desc' });
  }

  const [total, books] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reviews: {
          where: { status: 'published' },
          select: { rating: true },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const items: BookListItem[] = books.map((book) => {
    const publishedReviews = book.reviews;
    const reviewCount = publishedReviews.length;
    const avgRating =
      reviewCount > 0
        ? Math.round((publishedReviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
        : null;

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      summary: book.summary,
      coverImage: book.coverImage,
      genre: book.genre,
      language: book.language,
      pageCount: book.pageCount,
      publishedAt: book.publishedAt,
      price: book.price,
      format: book.format,
      avgRating,
      reviewCount,
    };
  });

  // For 'highest_rated', sort by avg rating in memory
  if (sort === 'highest_rated') {
    items.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  }

  return { items, total, page, limit, totalPages };
}

// ─── Public: Get single book with stats ─────────────────────────────────────

export async function getBookById(id: string, userId?: string): Promise<BookDetail | null> {
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      reviews: {
        where: { status: 'published' },
        select: { rating: true, userId: true },
      },
    },
  });

  if (!book) return null;

  const reviewCount = book.reviews.length;
  const avgRating =
    reviewCount > 0
      ? Math.round((book.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
      : null;

  // Rating distribution 1-5
  const distribution: Array<{ stars: number; count: number }> = [];
  for (let stars = 5; stars >= 1; stars--) {
    distribution.push({
      stars,
      count: book.reviews.filter((r) => r.rating === stars).length,
    });
  }

  let userRating: number | null = null;
  let userReadingStatus: string | null = null;

  if (userId) {
    const userReview = book.reviews.find((r) => r.userId === userId);
    userRating = userReview?.rating ?? null;

    const readingStatus = await prisma.readingStatus.findUnique({
      where: { userId_bookId: { userId, bookId: id } },
      select: { status: true },
    });
    userReadingStatus = readingStatus?.status ?? null;
  }

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    summary: book.summary,
    coverImage: book.coverImage,
    genre: book.genre,
    language: book.language,
    pageCount: book.pageCount,
    publishedAt: book.publishedAt,
    price: book.price,
    format: book.format,
    isbn: book.isbn,
    stock: book.stock,
    fileUrl: book.fileUrl,
    previewUrl: book.previewUrl,
    avgRating,
    reviewCount,
    ratingDistribution: distribution,
    userRating,
    userReadingStatus,
  };
}

// ─── Public: List distinct genres ───────────────────────────────────────────

export async function getGenres(): Promise<string[]> {
  const result = await prisma.book.findMany({
    where: { genre: { not: null } },
    select: { genre: true },
    distinct: ['genre'],
  });
  return result
    .map((r) => r.genre as string)
    .filter(Boolean)
    .sort();
}

// ─── Public: Get reviews for a book ─────────────────────────────────────────

export async function getBookReviews(
  bookId: string,
  sortBy: 'newest' | 'highest' | 'lowest' | 'helpful' | 'liked' = 'newest',
  page = 1,
  limit = 10,
  userId?: string
): Promise<Paginated<ReviewItem>> {
  const where: Prisma.BookReviewWhereInput = {
    bookId,
    status: 'published',
  };

  const orderBy: Prisma.BookReviewOrderByWithRelationInput[] = [];
  switch (sortBy) {
    case 'newest':
      orderBy.push({ createdAt: 'desc' });
      break;
    case 'highest':
      orderBy.push({ rating: 'desc' });
      break;
    case 'lowest':
      orderBy.push({ rating: 'asc' });
      break;
    case 'helpful':
      orderBy.push({ helpfulCount: 'desc' });
      break;
    case 'liked':
      orderBy.push({ likes: { _count: 'desc' } });
      break;
    default:
      orderBy.push({ createdAt: 'desc' });
  }

  const [total, reviews] = await Promise.all([
    prisma.bookReview.count({ where }),
    prisma.bookReview.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        likes: userId ? { where: { userId } } : false,
        helpful: userId ? { where: { userId } } : false,
      },
    }),
  ]);

  const items: ReviewItem[] = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    content: review.content,
    title: review.title,
    language: review.language,
    status: review.status,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user,
    likedByUser: Array.isArray(review.likes) && review.likes.length > 0,
    helpfulByUser: Array.isArray(review.helpful) && review.helpful.length > 0,
  }));

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Auth: Create a review ──────────────────────────────────────────────────

export async function createReview(
  userId: string,
  bookId: string,
  rating: number,
  content: string,
  title?: string,
  language = 'en'
): Promise<ReviewItem> {
  validateRating(rating);
  validateContent(content);
  validateTitle(title);

  // Verify book exists
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error('Book not found');

  // One review per user per book (enforced by @@unique, but check for friendly error)
  const existing = await prisma.bookReview.findUnique({
    where: { userId_bookId: { userId, bookId } },
  });
  if (existing) {
    throw new Error('You have already reviewed this book');
  }

  const review = await prisma.bookReview.create({
    data: {
      userId,
      bookId,
      rating,
      content,
      title,
      language,
      status: 'published',
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return {
    id: review.id,
    rating: review.rating,
    content: review.content,
    title: review.title,
    language: review.language,
    status: review.status,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user,
    likedByUser: false,
    helpfulByUser: false,
  };
}

// ─── Auth: Update own review ────────────────────────────────────────────────

export async function updateReview(
  reviewId: string,
  userId: string,
  rating: number,
  content: string,
  title?: string
): Promise<ReviewItem> {
  validateRating(rating);
  validateContent(content);
  validateTitle(title);

  const review = await prisma.bookReview.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error('Review not found');
  if (review.userId !== userId) throw new Error('Not authorized to update this review');

  const updated = await prisma.bookReview.update({
    where: { id: reviewId },
    data: { rating, content, title },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return {
    id: updated.id,
    rating: updated.rating,
    content: updated.content,
    title: updated.title,
    language: updated.language,
    status: updated.status,
    helpfulCount: updated.helpfulCount,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    user: updated.user,
    likedByUser: false,
    helpfulByUser: false,
  };
}

// ─── Auth: Delete own review (owner or admin) ──────────────────────────────

export async function deleteReview(reviewId: string, userId: string, isAdmin = false): Promise<void> {
  const review = await prisma.bookReview.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error('Review not found');
  if (review.userId !== userId && !isAdmin) {
    throw new Error('Not authorized to delete this review');
  }

  // Delete related likes + helpful first (cascade handles it, but be explicit)
  await prisma.$transaction([
    prisma.like.deleteMany({ where: { reviewId } }),
    prisma.reviewHelpful.deleteMany({ where: { reviewId } }),
    prisma.bookReview.delete({ where: { id: reviewId } }),
  ]);
}

// ─── Auth: Toggle helpful vote ──────────────────────────────────────────────

export async function toggleHelpful(userId: string, reviewId: string): Promise<{ helpful: boolean; helpfulCount: number }> {
  const review = await prisma.bookReview.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error('Review not found');

  const existing = await prisma.reviewHelpful.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });

  if (existing) {
    // Remove helpful
    await prisma.$transaction([
      prisma.reviewHelpful.delete({ where: { id: existing.id } }),
      prisma.bookReview.update({
        where: { id: reviewId },
        data: { helpfulCount: Math.max(0, review.helpfulCount - 1) },
      }),
    ]);
    return { helpful: false, helpfulCount: Math.max(0, review.helpfulCount - 1) };
  } else {
    // Add helpful
    await prisma.$transaction([
      prisma.reviewHelpful.create({ data: { reviewId, userId } }),
      prisma.bookReview.update({
        where: { id: reviewId },
        data: { helpfulCount: review.helpfulCount + 1 },
      }),
    ]);
    return { helpful: true, helpfulCount: review.helpfulCount + 1 };
  }
}

// ─── Auth: Set reading status ───────────────────────────────────────────────

export async function setReadingStatus(
  userId: string,
  bookId: string,
  status: 'WANT_TO_READ' | 'CURRENTLY_READING' | 'COMPLETED'
): Promise<{ status: string }> {
  const valid = ['WANT_TO_READ', 'CURRENTLY_READING', 'COMPLETED'];
  if (!valid.includes(status)) {
    throw new Error('Invalid reading status');
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new Error('Book not found');

  const existing = await prisma.readingStatus.findUnique({
    where: { userId_bookId: { userId, bookId } },
  });

  if (existing) {
    await prisma.readingStatus.update({
      where: { id: existing.id },
      data: { status },
    });
  } else {
    await prisma.readingStatus.create({ data: { userId, bookId, status } });
  }

  return { status };
}

// ─── Auth: Get reading status ───────────────────────────────────────────────

export async function getReadingStatus(userId: string, bookId: string): Promise<{ status: string | null }> {
  const record = await prisma.readingStatus.findUnique({
    where: { userId_bookId: { userId, bookId } },
    select: { status: true },
  });
  return { status: record?.status ?? null };
}

// ─── Public: Reviewer stats ─────────────────────────────────────────────────

export async function getReviewerStats(userId: string) {
  const [reviews, totalHelpful, totalLikes, genreBreakdown] = await Promise.all([
    prisma.bookReview.findMany({
      where: { userId, status: 'published' },
      select: { rating: true, helpfulCount: true, book: { select: { genre: true } } },
    }),
    prisma.bookReview.aggregate({
      where: { userId, status: 'published' },
      _sum: { helpfulCount: true },
    }),
    prisma.like.count({
      where: { review: { userId, status: 'published' } },
    }),
    prisma.bookReview.groupBy({
      by: ['bookId'],
      where: { userId, status: 'published' },
      _count: true,
    }),
  ]);

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
      : null;

  return {
    totalReviews,
    avgRating,
    totalHelpful: totalHelpful._sum.helpfulCount || 0,
    totalLikes,
    genreBreakdown: genreBreakdown.length,
  };
}

// ─── Public: Reviewer reviews (paginated) ───────────────────────────────────

export async function getReviewerReviews(
  userId: string,
  page = 1,
  limit = 10
): Promise<Paginated<ReviewItem>> {
  const where: Prisma.BookReviewWhereInput = {
    userId,
    status: 'published',
  };

  const [total, reviews] = await Promise.all([
    prisma.bookReview.count({ where }),
    prisma.bookReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        book: { select: { id: true, title: true, author: true, coverImage: true } },
      },
    }),
  ]);

  const items = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    content: review.content,
    title: review.title,
    language: review.language,
    status: review.status,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user,
    book: review.book,
    likedByUser: false,
    helpfulByUser: false,
  }));

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
