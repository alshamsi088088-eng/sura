import axios from 'axios';

// ─── Types ──────────────────────────────────────────────────────────────────

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

export interface LeaderboardMetrics {
  readingPoints: number;
  completedArticles: number;
  completedSeries: number;
  reviews: number;
  helpfulVotes: number;
  community: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  level: string;
  score: number;
  metrics: LeaderboardMetrics;
}

export interface LeaderboardResponse {
  period: LeaderboardPeriod;
  periodKey: string;
  generatedAt: string;
  entries: LeaderboardEntry[];
  total: number;
}

export interface ReaderLevelDef {
  key: string;
  labelEn: string;
  labelAr: string;
  minXp: number;
  color: string;
}

export interface MyRankResponse {
  period: LeaderboardPeriod;
  periodKey: string;
  rank: number | null;
  score: number;
  metrics: LeaderboardMetrics | null;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    level: string;
  } | null;
}

export interface ProfilePreview {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  level: string;
  xp: number;
  allTimeRank: number | null;
  allTimeScore: number;
}

// ─── API Service ────────────────────────────────────────────────────────────

const api = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchLeaderboard(
  period: LeaderboardPeriod = 'alltime',
  limit = 50,
  refresh = false
): Promise<LeaderboardResponse> {
  const params: Record<string, string> = { period, limit: String(limit) };
  if (refresh) params.refresh = 'true';
  const { data } = await api.get('/api/leaderboard', { params });
  return data;
}

export async function fetchLevels(): Promise<ReaderLevelDef[]> {
  const { data } = await api.get('/api/leaderboard/levels');
  return data.levels;
}

export async function fetchMyRank(period: LeaderboardPeriod = 'alltime'): Promise<MyRankResponse> {
  const { data } = await api.get('/api/leaderboard/me', { params: { period } });
  return data;
}

export async function fetchProfilePreview(userId: string): Promise<ProfilePreview> {
  const { data } = await api.get(`/api/leaderboard/user/${userId}`);
  return data;
}

export async function refreshLeaderboard(): Promise<{ success: boolean; results: Record<string, LeaderboardResponse> }> {
  const { data } = await api.post('/api/leaderboard/refresh');
  return data;
}
