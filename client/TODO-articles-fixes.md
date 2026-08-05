# TODO: Fix Articles page production issues

## Problem
- Articles page shows raw HTML tags in excerpts
- Article card layout is inconsistent / overflowing
- Anonymous visitors trigger authenticated endpoints (401s)
- Unexpected 500 responses possible

## Steps
- [x] 1. Add stripHtml helper to ArticlesPage.tsx
- [x] 2. Render stripped excerpts with line-clamp
- [x] 3. Fix grid layout (consistent heights, no col-span hack, responsive)
- [x] 4. Make GET /api/engagement/bookmark anonymous-friendly (server)
- [x] 5. Skip supabase reads in LikeButton/BookmarkButton when !user
- [x] 6. Rebuild client (build SUCCESS in 18.73s; no vendor-charts chunk; serve.json copied)
- [x] 7. Redeploy client + server (pushed to origin/main 42ed59b; Railway deployed)
- [x] 8. Verify LIVE production (https://sura-codex.com ALL PASSED):
  - [x] Homepage loads: 200
  - [x] All public routes return HTTP 200 (/ , /articles, /novels, /gallery, /store, /tech, /about, /contact, /login, /register, www)
  - [x] robots.txt 200, ads.txt 200, sitemap.xml 200 + valid XML (urlset)
  - [x] No vendor-charts chunk in live index.html (entry index--2pD7RsX.js)
  - [x] GET /api/engagement/bookmark anonymous returns 200 (was 401) - fix LIVE
  - [x] GET /api/engagement/like anonymous returns 200
  - [x] Live JS bundle loads (200, 619,874 bytes)
  - [x] stripHtml removes visible HTML tags in article excerpts
  - [x] Zero unexpected 401 (bookmark GET now public)
  - [x] Zero 500 responses
  - [x] Layout normalized (no col-span hack, line-clamp, consistent)
