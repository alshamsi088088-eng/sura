# Production Hardening - Google AdSense Submission

## PWA / Favicon
- [x] Generate favicon.ico (add to generate-favicons.js + run)
- [x] Reference favicon.ico in index.html
- [x] Verify all favicon PNGs exist and load
- [x] Update manifest.json with PNG icons

## Server Security
- [x] Add security headers middleware to server/src/app.ts (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- [x] Wire in rateLimiter for auth routes

## SEO / Canonical Consistency
- [x] Fix VITE_PUBLIC_BASE_URL || '' fallbacks across pages to use safe default (seoUrl.ts helper)
- [x] Add BreadcrumbList JSON-LD to Breadcrumbs component
- [x] Verify no duplicate canonical URLs

## Ads
- [x] Verify ads.txt format is valid

## Final Validation
- [x] Run tsc --noEmit (client + server)
- [x] Run production build
- [ ] Verify favicon loads HTTP 200
- [ ] Verify sitemap/robots reachable
- [ ] Verify all public pages have SEO metadata
- [x] Generate final AdSense/SEO/Accessibility/Performance/Security report
