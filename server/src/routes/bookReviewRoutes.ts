import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import {
  getBooks,
  getBookById,
  getGenres,
  getBookReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  setReadingStatus,
  getReadingStatus,
  getReviewerStats,
  getReviewerReviews,
} from '../controllers/bookReviewController.js';

export const bookReviewRoutes = Router();

// ─── Public Routes (no auth required) ───────────────────────────────────────

// List books with filters (search, genre, language, rating, sort, pagination)
bookReviewRoutes.get('/reviews/books', getBooks);

// Single book with avg rating, distribution, review count
bookReviewRoutes.get('/reviews/books/:id', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return getBookById(req, res);
  next();
}, authGuard, getBookById);

// List distinct genres
bookReviewRoutes.get('/reviews/genres', getGenres);

// Reviews for a specific book (sort: newest/helpful/liked, pagination)
bookReviewRoutes.get('/reviews/books/:id/reviews', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return getBookReviews(req, res);
  next();
}, authGuard, getBookReviews);

// Reviewer profile stats
bookReviewRoutes.get('/reviews/users/:userId/stats', getReviewerStats);

// Reviewer reviews (paginated)
bookReviewRoutes.get('/reviews/users/:userId/reviews', getReviewerReviews);

// ─── Authenticated Routes ───────────────────────────────────────────────────

// Create a review for a book
bookReviewRoutes.post('/reviews/books/:id/reviews', authGuard, createReview);

// Update own review
bookReviewRoutes.put('/reviews/books/:id/reviews/:reviewId', authGuard, updateReview);

// Delete own review (owner or admin)
bookReviewRoutes.delete('/reviews/books/:id/reviews/:reviewId', authGuard, deleteReview);

// Toggle helpful vote on a review
bookReviewRoutes.post('/reviews/reviews/:reviewId/helpful', authGuard, toggleHelpful);

// Set reading status for a book
bookReviewRoutes.put('/reviews/books/:id/reading-status', authGuard, setReadingStatus);

// Get current user's reading status for a book
bookReviewRoutes.get('/reviews/books/:id/reading-status', authGuard, getReadingStatus);
