# Sprint 15 — Phase 2 (Client: Live Discussion & Study Circles)

## TODO Checklist ✅

### 1. API services ✅
- [x] Create `client/src/services/discussionService.ts`
- [x] Create `client/src/services/studyCircleService.ts`

### 2. Realtime context ✅
- [x] Create `client/src/context/LiveRoomContext.tsx` (integrates the existing singleton `socketService`)

### 3. Shared UI primitives ✅
- [x] Create `client/src/components/feed/EmptyState.tsx`
- [x] Create `client/src/components/feed/ErrorState.tsx`

### 4. Live Room components ✅
- [x] Create `client/src/components/discussion/LiveChat.tsx`
- [x] Create `client/src/components/discussion/MessageItem.tsx`
- [x] Create `client/src/components/discussion/TypingIndicator.tsx`
- [x] Create `client/src/components/discussion/OnlineUsersList.tsx`
- [x] Create `client/src/components/discussion/PinnedMessagesPanel.tsx`
- [x] Create `client/src/components/discussion/MessageSearchBar.tsx`
- [x] Create `client/src/components/discussion/ReportModal.tsx`
- [x] Create `client/src/components/discussion/MuteDialog.tsx`

### 5. Study Circle components ✅
- [x] Create `client/src/components/circles/CircleCard.tsx`
- [x] Create `client/src/components/circles/CircleMembersList.tsx`
- [x] Create `client/src/components/circles/CircleCalendar.tsx`
- [x] Create `client/src/components/circles/CircleGoalsPanel.tsx`
- [x] Create `client/src/components/circles/CircleNotesPanel.tsx`
- [x] Create `client/src/components/circles/CircleAssignmentsPanel.tsx`
- [x] Create `client/src/components/circles/CircleSessionsPanel.tsx`

### 6. Pages ✅
- [x] Create `client/src/pages/LiveRoomsPage.tsx`
- [x] Create `client/src/pages/LiveRoomPage.tsx`
- [x] Create `client/src/pages/StudyCirclesPage.tsx`
- [x] Create `client/src/pages/StudyCircleDetailPage.tsx`
- [x] Create `client/src/pages/CreateStudyCirclePage.tsx`

### 7. Routing & navigation ✅
- [x] Add lazy-loaded routes in `client/src/App.tsx`
- [x] Add nav links (desktop + mobile) in `client/src/components/layout/Navbar.tsx`

### 8. Localization ✅
- [x] Add English keys to `client/src/locales/en.json`
- [x] Add Arabic keys to `client/src/locales/ar.json`
- [x] Add notification icons for `mention` / `circle` types in `NotificationCenter.tsx`

### 9. Verification (after Phase 2)
- [ ] `npx tsc --noEmit` (client) — also fix pre-existing errors in `ReaderStats.tsx` / `ReadingHistoryList.tsx`
- [ ] `npx eslint .` (client)
- [ ] `npm run build` (client) — fix every warning/error

---

## Files to CREATE

| File | Purpose |
|---|---|
| `client/src/services/discussionService.ts` | Axios API client for `/api/discussion` (rooms, messages, pin, delete, mute, unmute, report, read, unread, search) |
| `client/src/services/studyCircleService.ts` | Axios API client for `/api/study-circles` (circles, membership, schedule, goals, notes, assignments, submissions, calendar) |
| `client/src/context/LiveRoomContext.tsx` | Realtime room state via existing singleton `socketService` (presence, typing, realtime messages, unread) |
| `client/src/components/feed/EmptyState.tsx` | Reusable empty-state block (icon + title + description + action) |
| `client/src/components/feed/ErrorState.tsx` | Reusable error/retry block with `role="alert"` |
| `client/src/components/discussion/LiveChat.tsx` | Chat thread: history, composer, reply-to, realtime messages, typing, autoscroll |
| `client/src/components/discussion/MessageItem.tsx` | Single message: avatar, name, time, text, reply, reactions, pin, delete, report, mute actions |
| `client/src/components/discussion/TypingIndicator.tsx` | Live "typing…" indicator (`aria-live="polite"`) |
| `client/src/components/discussion/OnlineUsersList.tsx` | Presence list from context (count + names/avatars) |
| `client/src/components/discussion/PinnedMessagesPanel.tsx` | Collapsible pinned-messages list |
| `client/src/components/discussion/MessageSearchBar.tsx` | Message search within room + jump-to-result |
| `client/src/components/discussion/ReportModal.tsx` | Accessible report dialog (focus, Esc, role="dialog") |
| `client/src/components/discussion/MuteDialog.tsx` | Accessible mute-member dialog with duration presets |
| `client/src/components/circles/CircleCard.tsx` | Circle preview card (title, description, members, schedule, join state) |
| `client/src/components/circles/CircleMembersList.tsx` | Member list with roles + moderator assignment (owner) |
| `client/src/components/circles/CircleCalendar.tsx` | Agenda combining schedule + assignment due dates + goal weeks |
| `client/src/components/circles/CircleGoalsPanel.tsx` | Weekly goals with progress bars + add/update controls |
| `client/src/components/circles/CircleNotesPanel.tsx` | Shared notes list + create/edit/delete (author-only) |
| `client/src/components/circles/CircleAssignmentsPanel.tsx` | Assignments + submissions + scoring (mod) |
| `client/src/components/circles/CircleSessionsPanel.tsx` | Upcoming/past reading sessions derived from schedule |
| `client/src/pages/LiveRoomsPage.tsx` | Room grid, search, create-room form, SEO tags |
| `client/src/pages/LiveRoomPage.tsx` | Full room view (chat, presence, pins, search, moderation), SEO tags |
| `client/src/pages/StudyCirclesPage.tsx` | Circle grid, search, CTA to create, SEO tags |
| `client/src/pages/StudyCircleDetailPage.tsx` | Circle dashboard (members, schedule, goals, notes, assignments, sessions), SEO tags |
| `client/src/pages/CreateStudyCirclePage.tsx` | Create-circle form with initial schedule, redirects on success |

## Files to MODIFY

| File | Change | Purpose |
|---|---|---|
| `client/src/App.tsx` | Add lazy routes: `/live-rooms`, `/live-rooms/:id`, `/study-circles`, `/study-circles/:id`, `/study-circles/new` | Expose new pages (lazy-loaded) |
| `client/src/components/layout/Navbar.tsx` | Add "Live Rooms" + "Study Circles" nav items (desktop `navItems` + mobile drawer) | Navigation |
| `client/src/locales/en.json` | Add community keys (rooms, circles, schedule, goals, notes, assignments, sessions, moderation) | i18n |
| `client/src/locales/ar.json` | Arabic translations for new keys (RTL) | i18n |
| `client/src/components/NotificationCenter.tsx` | Add icon cases for `mention` and `circle` types | Support Sprint 15 notification types |
| `client/src/components/ReaderStats.tsx` | Fix pre-existing recharts typing errors | tsc pass |
| `client/src/components/ReadingHistoryList.tsx` | Fix pre-existing `supabase` nullable error | tsc pass |

