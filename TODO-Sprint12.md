# Sprint 12 — Reading Series — Implementation Plan

## ✅ Step 1: Database Schema (schema.prisma)
- [x] Add `Series` model (title, slug, description, coverImage, estimatedReadingTime, difficulty, category, authorName, authorId)
- [x] Add `SeriesItem` model (seriesId, contentType, contentId, order) — polymorphic content association
- [x] Add `series` relation to User model
- [x] Run `prisma generate`

## ✅ Step 2: Server — Series Service (server/src/services/seriesService.ts)
- [x] `getAllSeries(userId?)` — List all series with optional user progress
- [x] `getSeriesBySlug(slug, userId?)` — Single series with items + progress
- [x] `getSeriesProgress(seriesId, userId)` — Derive 0/25/50/75/100% from ReadingHistory via thresholds
- [x] `getContinueReading(seriesId, userId)` — First article with 0 < progress < 100
- [x] `getRecommendedSeries(userId?, category)` — Based on categories (excludes completed for auth users)
- [x] Admin: `createSeries`, `updateSeries`, `deleteSeries`, `reorderItems`, `assignItem`, `removeItem`

## ✅ Step 3: Server — Series Controller (server/src/controllers/seriesController.ts)
- [x] Thin controllers delegating to seriesService

## ✅ Step 4: Server — Series Routes (server/src/routes/seriesRoutes.ts)
- [x] Public: GET /api/series, GET /api/series/:slug, GET /api/series/:slug/progress
- [x] Public: GET /api/recommended-series
- [x] Admin: POST/ PUT/ DELETE /api/admin/series/:id
- [x] Admin: PUT /api/admin/series/:id/reorder, POST/ DELETE items

## ✅ Step 5: Server — app.ts Integration
- [x] Mount series routes at /api

## ✅ Step 6: Client — Series Service (client/src/services/seriesService.ts)
- [x] API client functions matching backend endpoints + types

## ✅ Step 7: Client — UI Components
- [x] `SeriesCard` — Cover, title, difficulty, progress, category
- [x] `SeriesProgressBar` — 0/25/50/75/100% visual indicator
- [x] `SeriesNavigation` — Prev/Next/Continue/Completed
- [x] `RecommendedSeries` — Sidebar widget

## ✅ Step 8: Client — Pages
- [x] `SeriesPage` — Grid of series cards with filters
- [x] `SeriesDetailPage` — Series header + article list with progress

## ✅ Step 9: Client — App.tsx Routes
- [x] `/series` → SeriesPage
- [x] `/series/:slug` → SeriesDetailPage

## ✅ Step 10: Client — Navbar Integration
- [x] Add "Series" link to navigation

## ✅ Step 11: Locale Strings
- [x] Add "series" key to en.json and ar.json

## ✅ Step 12: SEO Integration
- [x] SeoHead for series pages
- [x] JSON-LD structured data
- [x] Sitemap integration (series URLs in sitemap.xml)

## ⬜ Step 13: Build & Validation
- [ ] TypeScript validation
- [ ] ESLint checks
- [ ] Production build
- [ ] Verify existing features unaffected

