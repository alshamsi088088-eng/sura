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
- [ ] 7. Redeploy client + server
- [ ] 8. Verify LIVE production:
  - zero visible HTML tags
  - zero unexpected console errors
  - zero unexpected 401 responses
  - zero 500 responses
  - correct article layout
  - all public pages return HTTP 200
