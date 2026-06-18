# Sura Codex – Phases 3–6 TODO

- [x] Phase 3: Analytics hardening
  - [x] Refactor BookmarkButton to emit centralized `bookmark_update`
  - [x] Refactor ReadingProgressTracker to emit `reading_progress_update`
  - [ ] Audit and align analytics event usage in Store/Profile/Comments flows

- [ ] Phase 4: Comments system completion
  - [ ] Ensure ThreadedComments supports create/reply/moderation/realtime cleanly
  - [ ] Integrate comments on NovelsPage
  - [ ] Integrate comments on StorePage
  - [ ] Improve ArticlesPage selected-article comments behavior
  - [ ] Add Admin moderation UX around comments visibility

- [ ] Phase 5: Commerce + profile + reading goals
  - [ ] Add StorePage coupon validation flow
  - [ ] Add StorePage preview/download CTA wiring
  - [ ] Add StorePage checkout analytics events
  - [ ] Add ProfilePage purchase history section
  - [ ] Add ProfilePage gated download actions
  - [ ] Add HomePage weekly reading aggregation panel

- [ ] Phase 6: Backend fixups + verification
  - [ ] Remove/fix invalid Stripe discounts placeholder in storeController checkout
  - [ ] Run critical-path build and tests
  - [ ] Summarize coverage and remaining gaps
