# TODO

## Part A — Auth callback hash session handling
- [x] Inspect `client/src/pages/AuthCallbackPage.tsx`.
- [x] Rewrite to extract `access_token` and `refresh_token` from `window.location.hash`.
- [x] Call `supabase.auth.setSession({ access_token, refresh_token })`.
- [x] Redirect to `/dashboard` only after successful session set.

## Part B — Console 404/400 fixes
- [x] Remove/disable Google AdSense placeholder usage causing 400 errors.
- [ ] Fix missing static assets 404 (logo.svg, manifest.json) by ensuring references match `client/public`.
- [ ] Ensure Google Analytics tracking snippet is correctly placed in `client/index.html` within `<head>`.


