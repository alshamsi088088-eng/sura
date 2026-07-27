# HTML Entity Decode Fix for Article Content

## All Steps Completed ✓
- [x] Analyze root cause: affected article has HTML-entity-encoded content stored in DB
- [x] Create plan and get approval
- [x] 1. Add `decodeHtmlEntities` utility function to `ArticleDetailsPage.tsx`
- [x] 2. Apply decoder to `article.content` before rendering in QuoteHighlighter and content `<div>`
- [x] 3. TypeScript check (server) — ✅ Passed (no errors)
- [x] 4. TypeScript check (client) — ✅ Passed (no errors)
- [x] 5. Report findings

