import axios from 'axios';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SeriesListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  estimatedReadingTime: string;
  difficulty: string;
  category: string;
  authorName: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  progress?: number;
}

export interface SeriesItemInfo {
  id: string;
  seriesItemId: string;
  contentType: string;
  contentId: string;
  order: number;
  title: string;
  slug: string;
  readingTime: string;
  completed: boolean;
  progress: number;
}

export interface SeriesDetail extends SeriesListItem {
  items: SeriesItemInfo[];
}

export interface SeriesProgressInfo {
  totalItems: number;
  completedItems: number;
  progress: number;
  nextItem: { seriesItemId: string; contentType: string; contentId: string; title: string; slug: string } | null;
  previousItem: { seriesItemId: string; contentType: string; contentId: string; title: string; slug: string } | null;
  continueItem: { seriesItemId: string; contentType: string; contentId: string; title: string; slug: string } | null;
  completed: boolean;
}

export interface SeriesResponse {
  series: SeriesListItem[];
}

export interface SingleSeriesResponse {
  series: SeriesDetail;
}

// ─── API Service ────────────────────────────────────────────────────────────

const api = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchAllSeries(): Promise<SeriesListItem[]> {
  const { data } = await api.get<SeriesResponse>('/api/series');
  return data.series;
}

export async function fetchSeriesBySlug(slug: string): Promise<SeriesDetail> {
  const { data } = await api.get<SingleSeriesResponse>(`/api/series/${encodeURIComponent(slug)}`);
  return data.series;
}

export async function fetchSeriesProgress(slug: string): Promise<SeriesProgressInfo> {
  const { data } = await api.get<SeriesProgressInfo>(`/api/series/${encodeURIComponent(slug)}/progress`);
  return data;
}

export async function fetchRecommendedSeries(category?: string, limit = 4): Promise<SeriesListItem[]> {
  const params: Record<string, string | number> = { limit };
  if (category) params.category = category;
  const { data } = await api.get<SeriesResponse>('/api/recommended-series', { params });
  return data.series;
}

// ─── Admin API ──────────────────────────────────────────────────────────────

export async function adminCreateSeries(payload: {
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  estimatedReadingTime: string;
  difficulty: string;
  category: string;
  authorName: string;
}): Promise<SeriesListItem> {
  const { data } = await api.post('/api/admin/series', payload);
  return data.series;
}

export async function adminUpdateSeries(id: string, payload: Partial<{
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  estimatedReadingTime: string;
  difficulty: string;
  category: string;
  authorName: string;
}>): Promise<SeriesListItem> {
  const { data } = await api.put(`/api/admin/series/${id}`, payload);
  return data.series;
}

export async function adminDeleteSeries(id: string): Promise<void> {
  await api.delete(`/api/admin/series/${id}`);
}

export async function adminReorderItems(seriesId: string, orderedIds: string[]): Promise<void> {
  await api.put(`/api/admin/series/${seriesId}/reorder`, { orderedIds });
}

export async function adminAssignItem(seriesId: string, contentType: string, contentId: string, order?: number): Promise<void> {
  await api.post(`/api/admin/series/${seriesId}/items`, { contentType, contentId, order });
}

export async function adminRemoveItem(seriesId: string, itemId: string): Promise<void> {
  await api.delete(`/api/admin/series/${seriesId}/items/${itemId}`);
}
