# Sprint 13 — Phase 1B: Database & Backend API Implementation

> **Status:** Backend implementation ✅ COMPLETE. Migration & final build verification ⏳ PENDING (awaiting approval).
> Master plan: see `TODO-Sprint13.md`.

## Implementation Order

### Step 1: Prisma Schema Changes
- [x] Extend `Book` model (genre, language, pageCount, publishedAt, isbn, relations)
- [x] Extend `User` model (bookReviews, reviewHelpful, readingStatuses relations)
- [x] Extend `Like` model (reviewId field + relation + unique constraint)
- [x] Add `ReadingStatusType` enum
- [x] Add `BookReview` model
- [x] Add `ReviewHelpful` model
- [x] Add `ReadingStatus` model
- [x] Run `npx prisma generate`

### Step 2: Migration
- [ ] Create migration
- [ ] Verify migration is non-destructive
- [ ] Show migration summary for approval

### Step 3: Backend Service — bookReviewService.ts
- [x] `getBooks(filters)` — Search, genre, language, rating range, sort, paginate
- [x] `getBookById(id, userId?)` — Single book with avg rating, rating distribution, review count
- [x] `getGenres()` — List distinct genres from Book model
- [x] `getBookReviews(bookId, sortBy, page, limit)` — Reviews sorted by newest/helpful/liked
- [x] `createReview(userId, bookId, rating, content, title?, language?)` — Create review
- [x] `updateReview(reviewId, userId, rating, content, title?)` — Update own review
- [x] `deleteReview(reviewId, userId)` — Delete own review (owner/admin)
- [x] `toggleHelpful(userId, reviewId)` — Toggle helpful vote, sync helpfulCount
- [x] `setReadingStatus(userId, bookId, status)` — Upsert reading status
- [x] `getReadingStatus(userId, bookId)` — Get user's reading status
- [x] `getReviewerStats(userId)` — Total reviews, avg rating, total helpful votes, genre breakdown
- [x] `getReviewerReviews(userId, page, limit)` — Paginated reviews by user
- [x] Validation: rating 1-5, content length, ownership, one review per user per book

### Step 4: Backend Controller — bookReviewController.ts
- [x] `getBooks` handler
- [x] `getBookById` handler
- [x] `getGenres` handler
- [x] `getBookReviews` handler
- [x] `createReview` handler
- [x] `updateReview` handler
- [x] `deleteReview` handler
- [x] `toggleHelpful` handler
- [x] `setReadingStatus` handler
- [x] `getReadingStatus` handler
- [x] `getReviewerStats` handler
- [x] `getReviewerReviews` handler

### Step 5: Backend Routes — bookReviewRoutes.ts
- [x] Public routes (no auth)
- [x] Authenticated routes (authGuard)
- [x] Admin routes (roleGuard)

### Step 6: App.ts Integration
- [x] Mount bookReviewRoutes at /api/reviews

### Step 7: Build Verification
- [x] TypeScript check (`npx tsc --noEmit`) — PASSED (0 errors)
- [x] ESLint on new files
- [ ] Production build check
- [ ] Verify existing features unaffected

