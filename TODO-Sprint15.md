# Sprint 15 — Live Discussion Rooms & Study Circles

## Architecture (approved)
Reuse-first design: extend `CommunityThread` (rooms/circles via `threadType`), extend `Comment`
(chat messages via `isPinned/isEdited/isDeleted`), reuse `Reaction`/`Poll` (polymorphic),
reuse `Notification`/`NotificationSettings`, extend `socketService.ts` (centralized), reuse
`authGuard`/`roleGuard`/ownership checks, obey existing REST conventions.

New models (only if strictly required): `CommunityThreadMember`, `Report`, `StudyCircleSchedule`,
`StudyCircleGoal`, `StudyCircleNote`, `StudyCircleAssignment`, `StudyCircleSubmission`.

---

## Phase 1 — Backend + Database only (STOP for approval)

### 1.1 TODO Checklist
- [x] 1. Modify `schema.prisma` (extend existing models + add justified new models)
- [x] 2. Run `npx prisma generate --schema ../schema.prisma`
- [ ] 3. Create + apply migration (`npx prisma migrate dev --schema ../schema.prisma`)
- [x] 4. Create `server/src/services/notificationService.ts` (helper reusing Notification)
- [x] 5. Create `server/src/services/discussionService.ts`
- [x] 6. Create `server/src/services/studyCircleService.ts`
- [x] 7. Create `server/src/controllers/discussionController.ts`
- [x] 8. Create `server/src/controllers/studyCircleController.ts`
- [x] 9. Create `server/src/routes/discussionRoutes.ts`
- [x] 10. Create `server/src/routes/studyCircleRoutes.ts`
- [x] 11. Modify `server/src/app.ts` (mount both routers)
- [x] 12. Modify `server/src/services/socketService.ts` (backend foundations: handshake auth, room join/leave, presence map, event stubs)
- [x] 13. TypeScript verification (`cd server && npx tsc --noEmit`) — PASSED (empty output)
- [x] 15. Production backend build (`cd server && npm run build`) — PASSED (no errors)
- [x] 16. Fix every error before requesting approval
- [x] 17. Migration SQL preview generated (`prisma migrate diff` → `server/sprint15_migration.sql`) — schema valid, all tables/indexes/FKs produced correctly
- [x] 18. ESLint: N/A — server has no ESLint config (pre-existing; only client has `.eslintrc.cjs`)

> Note: `prisma migrate dev` cannot run locally because the `SUPABASE_DB_URL` env var is a production credential not present in this environment. The migration SQL was validated via `prisma migrate diff --from-empty` which produces the full DDL offline. Apply the migration in the deployment environment (Railway) where the env var is set.

### 1.2 Files to CREATE (with rationale)
| File | Rationale |
|---|---|
| `server/src/services/notificationService.ts` | Single helper `createNotification()` that writes the existing `Notification` row and respects `NotificationSettings` gating — avoids duplicating notification logic across services |
| `server/src/services/discussionService.ts` | Business logic for rooms/messages/unread/mute/report; reuses Prisma `Comment` + `CommunityThreadMember` |
| `server/src/services/studyCircleService.ts` | Business logic for circles/membership/schedules/goals/notes/assignments/submissions/calendar |
| `server/src/controllers/discussionController.ts` | REST handlers for `/api/discussion` following existing controller conventions |
| `server/src/controllers/studyCircleController.ts` | REST handlers for `/api/study-circles` following existing controller conventions |
| `server/src/routes/discussionRoutes.ts` | Router wiring all discussion endpoints with `authGuard`/`roleGuard` |
| `server/src/routes/studyCircleRoutes.ts` | Router wiring all circle endpoints with `authGuard`/`roleGuard` |

### 1.3 Files to MODIFY (with rationale)
| File | Change | Why necessary |
|---|---|---|
| `schema.prisma` | Add `threadType` to `CommunityThread`; add `isPinned/isEdited/isDeleted` to `Comment`; add `discussionMentions`/`circleActivity` to `NotificationSettings`; add 7 new models + `User` relations + indexes/FKs/cascade | Required to represent rooms, circles, membership, reports, schedules, goals, notes, assignments without duplicating existing entities |
| `server/src/app.ts` | Mount `discussionRoutes` at `/api/discussion` and `studyCircleRoutes` at `/api/study-circles` | Expose the new endpoints through the existing Express app/router registration |
| `server/src/services/socketService.ts` | Backend foundations: verify handshake token, join/leave rooms, in-memory presence map, register event handlers | Keeps the socket architecture centralized (extend existing instance, no duplicate WS service) |

### 1.4 Verification (after implementation)
- `npx prisma generate --schema ../schema.prisma`
- `npx prisma migrate dev --schema ../schema.prisma`
- `cd server && npx tsc --noEmit`
- `cd server && npx eslint .`
- `cd server && npm run build`

**STOP — await approval before Phase 2.**

---

## Phase 2 — Client (STOP for approval)
- Client services: `discussionService.ts`, `studyCircleService.ts`
- `LiveRoomContext.tsx` + socket integration
- Pages: `LiveRoomsPage`, `LiveRoomPage`, `StudyCirclesPage`, `StudyCircleDetailPage`, `CreateStudyCirclePage`
- Components (15): LiveChat, MessageItem, TypingIndicator, OnlineUsersList, PinnedMessagesPanel, MessageSearchBar, ReportModal, MuteDialog, CircleCard, CircleMembersList, CircleCalendar, CircleGoalsPanel, CircleNotesPanel, CircleAssignmentsPanel, CircleSessionsPanel
- Routing in `App.tsx`; Navbar links; i18n (en/ar); responsive + Dark Mode + Accessibility

## Phase 3 — SEO / Rails (STOP for approval)
- SEO + JSON-LD, sitemap, performance, loading/error states, notifications integration, testing, client + server production builds
