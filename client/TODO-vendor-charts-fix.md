# TODO: Fix vendor-charts production crash

## Root Cause
Circular chunk dependency: `vendor-charts` ←→ `vendor-other` in manualChunks, causing `bo as w` (recharts' reselect dependency) to be `undefined` at module-eval time.

## Steps

- [x] Investigate & trace error to source
- [x] Identify exact source file: `client/src/components/ReaderStats.tsx` (only recharts consumer)
- [x] Identify root cause: circular chunk deps in manualChunks config
- [x] Plan approved by user

- [x] 1. Edit `client/vite.config.ts` - remove manualChunks function entirely
- [x] 2. Run `npm run build` inside client/
- [x] 3. Verify no circular chunk deps in dist/ (no vendor-charts/vendor-other)
- [x] 4. Verify dist/index.html loads correct scripts
- [x] 5. Serve production build locally (`vite preview`) - SPA fallback works
- [x] 6. Copy serve.json into dist for Railway SPA fallback (build script)
- [x] 7. Redeploy client to Railway (commits f2190e9, 0dfa45f pushed)
- [x] 8. Verify live site https://sura-codex.com - all 17 public routes HTTP 200, no circular chunk deps, recharts (with-selector) chunk loads cleanly
- [x] 9. Confirm Lighthouse/AdSense readiness not negatively affected

## SPA Fallback Fix (second issue found after first deploy)
Railway start command `npx serve dist -s` reads rewrite config from `serve.json` inside the served dir. The file existed at `client/serve.json` but was never copied into `dist/`, so deep client-side routes returned origin 404. Fixed by updating the build script to copy `serve.json` into `dist/` after `vite build`.

**DONE - all verified on live production.**

