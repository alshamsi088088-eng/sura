# Sprint 10 — Phase 1: Unified Dashboard Foundation

## Goal
Build a shared dashboard layout system with role-aware navigation. Keep `/admin` and `/dashboard` as separate routes but reuse the same layout infrastructure.

## Steps

### Step 1: Extend Role Types
- [x] Extend `UserRole` in `client/src/types.ts` to include `'author' | 'moderator'`
- [x] Update `normalizeRole` in `server/src/middleware/roleGuard.ts` to handle new roles

### Step 2: Create Shared Dashboard Layout
- [ ] Create `client/src/components/layout/DashboardLayout.tsx` — shared layout with sidebar + header + content area
- [x] Create `client/src/components/layout/DashboardSidebar.tsx` — role-aware sidebar navigation
- [x] Both components: responsive, dark/light mode, accessible, strict TypeScript

### Step 3: Refactor Member Dashboard (DashboardPage.tsx)
- [ ] Wrap existing content in `<DashboardLayout>`
- [ ] Pass appropriate nav items for `member` role
- [ ] Keep all existing dashboard features intact

### Step 4: Refactor Admin Dashboard (AdminPage.tsx)
- [ ] Wrap existing content in `<DashboardLayout>`
- [ ] Pass appropriate nav items for `admin` role
- [ ] Keep all existing admin tabs/features intact

### Step 5: Navigation Updates
- [ ] Navbar: admin users see link to `/admin`, members see `/dashboard`
- [ ] User menu: update links appropriately

### Step 6: Build & Verify
- [ ] Run `npm run build` on client
- [ ] Fix all TypeScript and ESLint errors
- [ ] Verify both `/dashboard` and `/admin` routes work
- [ ] Provide summary of all modified files

---

**Note**: Author and Moderator roles are type-defined only. No implementations yet.

