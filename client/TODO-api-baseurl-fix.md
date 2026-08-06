# TODO: Fix production API base URL (`.map`/`.slice`/`.length` on undefined)

## Root cause
All client services use `axios.create({})` with hardcoded relative `/api/*` paths.
In production the frontend (sura-codex.com nginx SPA) and backend API (https://api.sura-codex.com)
are SEPARATE origins. Requesting `sura-codex.com/api/*` returns the SPA `index.html`
(HTTP 200, `Content-Type: text/html`), so response bodies lack `entries`/`series`/`rooms`/`circles`
→ `.map` / `.slice` / `.length` crash. esbuild minification renames the broken local to `w`
→ "w is not a function".

## Tasks
1. Confirm scope: all client services/components/pages that call relative `/api/*`.
2. Update API services to use `getApiBaseUrl()` as axios `baseURL`:
   - `src/services/leaderboardService.ts`
   - `src/services/seriesService.ts`
   - `src/services/discussionService.ts`
   - `src/services/studyCircleService.ts`
   - `src/services/readerService.ts`
   - `src/services/adService.ts`
   - `src/services/socketService.ts` (uses `getSocketUrl()`)
3. Update components/pages using raw `fetch('/api/*')` to use `getApiBaseUrl()` and validate `res.ok` + `Content-Type` before parsing.
4. Add malformed-response/error guards in pages so no runtime throws.
5. Build, verify locally, commit, push, redeploy, verify LIVE.

