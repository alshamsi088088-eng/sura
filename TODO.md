# TODO - Stripe Checkout & Store/Profile/Navbar fixes

## Step 1 (Server)
- [ ] Update `server/src/controllers/storeController.ts`
  - [x] Strengthen STRIPE_SECRET_KEY validation + create Stripe client only when present
  - [x] Refactor `computeDiscount` to return `discountPercentage` (keep `discountAmount` for compatibility)
  - [x] Update `checkout` to apply discount to each Stripe `line_item` so Stripe totals are correct
  - [x] Improve Stripe error handling (map Stripe error types to HTTP responses)
  - [x] Update `validateCoupon` to return `discountPercentage` (and keep `discountAmount`)



## Step 2 (Server routes)
- [ ] Verify `server/src/routes/storeRoutes.ts` matches required endpoints (no DB changes expected)

## Step 3 (Client Store page)
- [ ] Update `client/src/pages/StorePage.tsx`
  - [x] Add loading/error state for Download button
  - [ ] On activeBook change (and/or download click), call `/api/store/download/:bookId` to confirm ownership
  - [ ] Only show/enable preview & download when allowed; keep cart/checkout intact


## Step 4 (Client Profile page)
- [ ] Update `client/src/pages/ProfilePage.tsx`
  - [ ] Ensure “My Purchases” aggregates books without duplicates
  - [ ] Show purchase price + purchase date
  - [ ] Render Download button per book
  - [ ] Proper “No purchases” empty state


## Step 5 (Client Navbar)
- [ ] Update `client/src/components/layout/Navbar.tsx`
  - [ ] Add dropdown/submenu “Create Content” for writers/admins
  - [ ] Add admin-only links: Manage Books, Manage Comments, Analytics

## Step 6 (Testing)
- [ ] Typecheck/build client and server
- [ ] Manual test: coupon percent/fixed affects checkout totals correctly
- [ ] Manual test: download gating for purchased/non-purchased users

