# Sprint 2.3 — Dynamic Pages SEO

## Progress

- [x] Step 1: Edit ArticlesPage.tsx — Add `locale` prop, JSON-LD `CollectionPage`, remove OG/Twitter images
- [x] Step 2: Edit ArticleDetailsPage.tsx — Add `locale` prop, remove logo.svg fallback for OG/Twitter images
- [x] Step 3: Edit NovelsPage.tsx — Add `locale` prop, JSON-LD `CollectionPage`, remove OG/Twitter images
- [x] Step 4: Edit CommunityPage.tsx — Add `locale` prop, OG/Twitter tags, JSON-LD `WebPage`
- [x] Step 5: Edit CommunityThreadPage.tsx — Add `locale` prop, OG/Twitter tags, JSON-LD `DiscussionForumPosting`
- [x] Step 6: Edit ProductsPage.tsx — Add `locale` prop, OG/Twitter tags, JSON-LD `CollectionPage`
# Sprint 2.4 — Technical SEO

## Progress

- [x] Step 1: Remove static `client/public/sitemap.xml` (dead code — server handles dynamically)
- [x] Step 2: Update `server/src/routes/seoRoutes.ts` — comprehensive robots.txt, sitemap with all page types
- [x] Step 3: Fix `client/index.html` — absolute URLs for OG/Twitter/canonical
- [x] Step 4: Add JSON-LD + `locale` to `GalleryPage.tsx`
- [x] Step 5: Add JSON-LD + `locale` to `TechPage.tsx`
- [x] Step 6: Add JSON-LD + `locale` to `StorePage.tsx`
- [x] Step 7: Verify TypeScript (client ✅ + server ✅ — zero errors)
- [x] Step 8: Verify ESLint (client ✅ — 0 errors, 6 pre-existing warnings)
