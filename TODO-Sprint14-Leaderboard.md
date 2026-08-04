# Sprint 14 — Community Leaderboard

## Plan
- Ranking metrics: Reading Points (10), Completed Articles (10), Completed Series (25), Reviews (15), Helpful Votes (5), Community Participation (2)
- Periods: Daily, Weekly, Monthly, All Time
- Reader Levels: Bronze, Silver, Gold, Diamond, Legend
- LeaderboardSnapshot cache table for performance
- Weights configurable via constants file

## Steps
- [x] 1. Schema changes (schema.prisma): ReaderLevel enum, User.level, LeaderboardSnapshot model
- [x] 2. Server: leaderboard config constants (weights)
- [x] 3. Server: readerLevelService.ts (level computation + sync)
- [x] 4. Server: leaderboardService.ts (scoring + snapshot + query)
- [x] 5. Server: leaderboardController.ts
- [x] 6. Server: leaderboardRoutes.ts + register in app.ts
- [x] 7. Client: leaderboardService.ts (API client + types)
- [x] 8. Client: leaderboard components (Table, TopReaders, LevelBadge, ProfilePreview, Achievements)
- [x] 9. Client: LeaderboardPage.tsx
- [x] 10. Client: App.tsx route + Navbar link + Dashboard sidebar link
- [x] 11. i18n: en.json / ar.json strings
- [x] 12. Run prisma generate + typecheck (server clean; client only pre-existing errors in ReaderStats/ReadingHistoryList)

## Deployment
- Apply DB changes: `npx prisma migrate dev --schema ../schema.prisma` (or `db push`) to create `ReaderLevel` enum, `User.level` column, and `LeaderboardSnapshot` table.
- (Optional) Add a cron/worker to periodically call `POST /api/leaderboard/refresh` (admin) to keep cached snapshots fresh.
</content>

