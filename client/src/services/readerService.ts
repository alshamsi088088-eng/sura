import axios from 'axios';
import { getApiBaseUrl } from '../lib/runtimeConfig';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DashboardOverview {
  totalArticlesRead: number;
  readingStreak: number;
  readingTimeMinutes: number;
  favoriteCategory: string | null;
  savedArticles: number;
  recentlyViewed: Array<{
    id: string;
    title: string;
    contentType: string;
    progress: number;
    updatedAt: Date;
  }>;
  completedSeries: number;
}

export interface WeeklyStats {
  week: string;
  items: Array<{ date: string; count: number }>;
  total: number;
}

export interface MonthlyStats {
  month: string;
  items: Array<{ week: string; count: number }>;
  total: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface CalendarDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface BadgeInfo {
  badgeKey: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
  progress: number;
}

export interface GoalInfo {
  type: 'weekly' | 'monthly';
  target: number;
  progress: number;
  percentage: number;
}

export interface GoalsResponse {
  weekly: GoalInfo;
  monthly: GoalInfo;
}

export interface CompletedSeriesItem {
  novelId: string;
  novelTitle: string;
  completedAt: Date;
}

export interface SavedArticle {
  id: string;
  contentType: string;
  contentId: string;
  title: string;
  savedAt: string;
}

// ─── API Service ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const { data } = await api.get('/api/reader/dashboard');
  return data;
}

export async function fetchWeeklyStats(): Promise<WeeklyStats[]> {
  const { data } = await api.get('/api/reader/stats/weekly');
  return data;
}

export async function fetchMonthlyStats(): Promise<MonthlyStats[]> {
  const { data } = await api.get('/api/reader/stats/monthly');
  return data;
}

export async function fetchCategoryDistribution(): Promise<CategoryDistribution[]> {
  const { data } = await api.get('/api/reader/stats/categories');
  return data;
}

export async function fetchReadingCalendar(year?: number): Promise<CalendarDay[]> {
  const params = year ? { year } : {};
  const { data } = await api.get('/api/reader/stats/calendar', { params });
  return data;
}

export async function fetchBadges(evaluate = false): Promise<BadgeInfo[]> {
  const params = evaluate ? { evaluate: 'true' } : {};
  const { data } = await api.get('/api/reader/badges', { params });
  return data;
}

export async function evaluateBadges(): Promise<{ success: boolean; badges: BadgeInfo[] }> {
  const { data } = await api.post('/api/reader/badges/evaluate');
  return data;
}

export async function fetchGoals(): Promise<GoalsResponse> {
  const { data } = await api.get('/api/reader/goals');
  return data;
}

export async function updateGoal(type: 'weekly' | 'monthly', target: number): Promise<GoalInfo> {
  const { data } = await api.post('/api/reader/goals', { type, target });
  return data;
}

export async function fetchCompletedSeries(): Promise<CompletedSeriesItem[]> {
  const { data } = await api.get('/api/reader/completed-series');
  return data;
}

export async function fetchSavedArticles(): Promise<SavedArticle[]> {
  const { data } = await api.get('/api/reader/saved');
  return data;
}

