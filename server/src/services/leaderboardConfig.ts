// ─── Leaderboard Configuration ─────────────────────────────────────────────
// All scoring weights and level thresholds are centralized here so they can be
// tuned without any database changes. Snapshots must be refreshed to apply
// new weights to cached rankings.

export interface LeaderboardWeights {
  readingPoint: number; // per completed article/chapter (Reading Points metric)
  completedArticle: number;
  completedSeries: number;
  review: number; // per published book review
  helpfulVote: number; // per helpful vote received on reviews
  community: number; // per comment / thread / reaction / like
}

export const LEADERBOARD_WEIGHTS: LeaderboardWeights = {
  readingPoint: 10,
  completedArticle: 10,
  completedSeries: 25,
  review: 15,
  helpfulVote: 5,
  community: 2,
};

// Period identifiers accepted by the public API
export const LEADERBOARD_PERIODS = ['daily', 'weekly', 'monthly', 'alltime'] as const;
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

// Default number of rows returned if `limit` is not specified
export const DEFAULT_LEADERBOARD_LIMIT = 50;
export const MAX_LEADERBOARD_LIMIT = 200;

// Reader levels (Bronze → Legend) with XP thresholds.
// `xpThreshold` is the minimum all-time XP required to reach the level.
export interface ReaderLevelDef {
  key: string; // matches Prisma enum: BRONZE | SILVER | GOLD | DIAMOND | LEGEND
  labelEn: string;
  labelAr: string;
  minXp: number;
  color: string; // accent color used by the UI
}

export const READER_LEVELS: ReaderLevelDef[] = [
  { key: 'BRONZE', labelEn: 'Bronze', labelAr: 'برونزي', minXp: 0, color: '#CD7F32' },
  { key: 'SILVER', labelEn: 'Silver', labelAr: 'فضي', minXp: 250, color: '#C0C0C0' },
  { key: 'GOLD', labelEn: 'Gold', labelAr: 'ذهبي', minXp: 750, color: '#FFD700' },
  { key: 'DIAMOND', labelEn: 'Diamond', labelAr: 'ماسي', minXp: 2000, color: '#7F77DD' },
  { key: 'LEGEND', labelEn: 'Legend', labelAr: 'أسطوري', minXp: 5000, color: '#F87171' },
];

