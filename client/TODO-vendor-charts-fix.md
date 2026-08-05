# TODO: Fix vendor-charts production crash

## Root Cause
Circular chunk dependency: `vendor-charts` ←→ `vendor-other` in manualChunks, causing `bo as w` (recharts' reselect dependency) to be `undefined` at module-eval time.

## Steps

- [x] Investigate & trace error to source
- [x] Identify exact source file: `client/src/components/ReaderStats.tsx` (only recharts consumer)
- [x] Identify root cause: circular chunk deps in manualChunks config
- [x] Plan approved by user

- [ ] 1. Edit `client/vite.config.ts` - remove manualChunks function entirely
- [ ] 2. Run `npm run build` inside client/
- [ ] 3. Verify no circular chunk deps in dist/
- [ ] 4. Verify dist/index.html loads correct scripts
- [ ] 5. Serve production build locally (`npx serve dist -l 4173 -s`)
- [ ] 6. Open http://localhost:4173 and verify zero console errors, Dashboard/ReaderStats renders
- [ ] 7. Redeploy client to Railway
- [ ] 8. Verify live site https://sura-codex.com - homepage loads, all public routes work, zero console errors
- [ ] 9. Confirm Lighthouse/AdSense readiness not negatively affected

