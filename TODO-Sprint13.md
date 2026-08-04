# Sprint 13 — Book Review Explorer

**Goal:** Build a dedicated Book Review Hub with search, genres, languages, ratings, sorting (newest/trending/helpful/liked), reviewer profiles, reading status, advanced filters, pagination, SEO, responsive + accessible UI.

---

## Phase 1 — Database & Backend API

### 1A. Database Analysis (DONE)
- [x] Analyze existing `Book`, `User`, `Like`, `Rating`, `Comment`, `Notification` models
- [x] Confirm no dedicated review model exists (reviews were comments+ratings on StorePage)
- [x] Confirm reader service pattern (seriesService) to replicate

### 1B. Schema + Backend Implementation (DONE — pending migration & build finalization)

#### Prisma Schema (schema.prisma)
- [x] Extend `Book` model (genre, language, pageCount, publishedAt, isbn, relations)
- [x] Extend `User` model (bookReviews, reviewHelpful, readingStatuses relations)
- [x] Extend `Like` model (reviewId field + relation + `@@unique([userId, reviewId])`)
- [x] Add `ReadingStatusType` enum (WANT_TO_READ | CURRENTLY_READING | COMPLETED)
- [x] Add `BookReview` model (rating 1-5, content, title?, status, helpfulCount, @@unique([userId, bookId]))
- [x] Add `ReviewHelpful` model (separate, @@unique([reviewId, userId]))
- [x] Add `ReadingStatus` model (separate intent model, enum status)
- [x] Run `npx prisma generate` (verified models present)

#### Migration
- [ ] Create migration (non-destructive, additive only)
- [ ] Verify migration summary shows only CREATE TABLE / ADD COLUMN / CREATE TYPE
- [ ] Apply migration (await approval)

#### Backend Service — `server/src/services/bookReviewService.ts`
- [x] `getBooks(filters)` — search, genre, language, rating range, sort, paginate
- [x] `getBookById(id, userId?)` — avg rating, rating distribution, review count
- [x] `getGenres()` — distinct genres
- [x] `getBookReviews(bookId, sortBy, page, limit)` — newest/highest/lowest/helpful/liked
- [x] `createReview` / `updateReview` / `deleteReview` with validation & ownership
- [x] `toggleHelpful` — creates/deletes ReviewHelpful + syncs denormalized helpfulCount (transaction)
- [x] `setReadingStatus` / `getReadingStatus` — upsert intent
- [x] `getReviewerStats` / `getReviewerReviews` — reviewer profile + paginated history
- [x] Validation: rating 1-5, content 10-5000 chars, one review per user per book

#### Backend Controller — `server/src/controllers/bookReviewController.ts`
- [x] All 12 handlers (getBooks, getBookById, getGenres, getBookReviews, createReview, updateReview, deleteReview, toggleHelpful, setReadingStatus, getReadingStatus, getReviewerStats, getReviewerReviews)

#### Backend Routes — `server/src/routes/bookReviewRoutes.ts`
- [x] Public routes (no auth): GET /reviews/books, /reviews/books/:id, /reviews/genres, /reviews/books/:id/reviews, /reviews/users/:userId/stats, /reviews/users/:userId/reviews
- [x] Authenticated routes (authGuard): POST/PUT/DELETE reviews, POST helpful, PUT/GET reading-status
- [x] Optional-auth pattern for getBookById & getBookReviews (inline Bearer token check)

#### App Integration — `server/src/app.ts`
- [x] Import + mount `bookReviewRoutes` at `/api`

#### Build Verification
- [x] TypeScript check (`npx tsc --noEmit`) — PASSED (0 errors)
- [ ] ESLint on new files
- [ ] Production build check
- [ ] Verify existing features unaffected

---

## Phase 2 — UI (NOT STARTED — awaiting approval)

### Client Service `client/src/services/bookReviewService.ts`
- [ ] API client functions + types matching backend

### Components
- [ ] `BookReviewCard` — cover, title, author, genre, avg rating, review count, reading status badge
- [ ] `ReviewCard` — avatar, rating stars, review text, helpful/like buttons, date
- [ ] `BookReviewFilters` — search, genre, language, sort, rating range
- [ ] `BookReviewPagination` — page numbers + prev/next
- [ ] `ReadingStatusButton` — 3-state: Completed / Currently Reading / Want to Read
- [ ] `ReviewStatistics` — rating distribution bar chart, avg, total
- [ ] `ReviewerProfileCard` — avatar, name, stats, join date
- [ ] `BookGridSkeleton` — loading skeleton

### Pages
- [ ] `BooksReviewHubPage` (/reviews) — hero + filters + grid + pagination
- [ ] `BookReviewDetailPage` (/reviews/:id) — book info + stats + status + write review + reviews list
- [ ] `ReviewerProfilePage` (/reviews/users/:userId) — profile stats + review history

### App Integration
- [ ] Add routes in `App.tsx`
- [ ] Add "Reviews" nav item in `Navbar.tsx`

### Locale Strings
- [ ] Add review strings to `en.json` and `ar.json`

---

## Phase 3 — SEO, Responsive, Accessibility (NOT STARTED — awaiting approval)

### SEO
- [ ] `useSeoTags` on all 3 pages (title, description, canonical, JSON-LD)
- [ ] CollectionPage JSON-LD for /reviews
- [ ] Book JSON-LD with aggregate rating for /reviews/:id
- [ ] Person JSON-LD for reviewer profile
- [ ] Sitemap integration for review URLs

### Responsive
- [ ] Mobile (<768px): 1-col grid, collapsible filter drawer, prev/next pagination
- [ ] Tablet (768-1024px): 2-col grid, horizontal scrollable filters
- [ ] Desktop (>1024px): 3/4-col grid, persistent filter sidebar, full pagination

### Accessibility
- [ ] ARIA labels on star ratings, filters, pagination
- [ ] Keyboard navigation (Tab, Enter/Space, Escape)
- [ ] Focus management on filter/pagination changes
- [ ] Screen reader announcements
- [ ] Alt text on all images

---

## Final Validation
- [ ] TypeScript compilation (server + client)
- [ ] ESLint checks
- [ ] Production build (server + client)
- [ ] Test all API endpoints
- [ ] Verify existing features unaffected
