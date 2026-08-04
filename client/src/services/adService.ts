import axios from 'axios';
import { getAuthHeaders } from '../lib/authHeaders';

// ─── Types ──────────────────────────────────────────────────────────────────

export type AdPosition = 'HOMEPAGE' | 'SIDEBAR' | 'BETWEEN_ARTICLES' | 'FOOTER' | 'CATEGORY';

export type AdCreativeType = 'adsense' | 'banner' | 'custom';

export interface AdRenderPayload {
  id: string;
  position: AdPosition;
  priority: number;
  provider: string;
  creativeType: AdCreativeType;
  bannerUrl?: string;
  clickUrl?: string;
  altText?: string;
  providerPayload: Record<string, unknown>;
}

export interface Ad {
  id: string;
  title: string;
  provider: string;
  providerData: Record<string, unknown> | null;
  position: AdPosition;
  priority: number;
  targeting: Record<string, unknown> | null;
  startAt: string | null;
  endAt: string | null;
  enabled: boolean;
  bannerUrl: string | null;
  clickUrl: string | null;
  altText: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdListResponse {
  ads: Ad[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdMetrics {
  impressions?: number;
  clicks?: number;
}

export interface AdInput {
  title: string;
  provider: string;
  providerData?: Record<string, unknown>;
  position: AdPosition;
  priority?: number;
  targeting?: Record<string, unknown>;
  startAt?: string | null;
  endAt?: string | null;
  enabled?: boolean;
  bannerUrl?: string | null;
  clickUrl?: string | null;
  altText?: string | null;
}

// ─── API Service ────────────────────────────────────────────────────────────

const api = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Public slot-resolving
export async function fetchSlotAds(
  position: AdPosition,
  options?: { category?: string; locale?: string }
): Promise<AdRenderPayload[]> {
  const params: Record<string, string> = {};
  if (options?.category) params.category = options.category;
  if (options?.locale) params.locale = options.locale;
  const { data } = await api.get<{ ads: AdRenderPayload[] }>(`/api/ads/slot/${position}`, { params });
  return data.ads;
}

export async function trackAdEvent(adId: string, type: 'impression' | 'click', meta?: Record<string, unknown>): Promise<void> {
  try {
    await api.post('/api/ads/track', { adId, type, meta });
  } catch {
    // Tracking must never break page rendering
  }
}

// Admin CRUD
export async function adminListAds(params?: {
  search?: string;
  position?: string;
  enabled?: boolean;
  page?: number;
}): Promise<AdListResponse> {
  const query: Record<string, string | number | boolean> = {};
  if (params?.search) query.search = params.search;
  if (params?.position) query.position = params.position;
  if (params?.enabled !== undefined) query.enabled = params.enabled;
  if (params?.page) query.page = params.page;
  const { data } = await api.get<AdListResponse>('/api/ads', { params: query });
  return data;
}

export async function adminGetAd(id: string): Promise<Ad> {
  const { data } = await api.get<{ ad: Ad }>(`/api/ads/${id}`);
  return data.ad;
}

export async function adminCreateAd(payload: AdInput): Promise<Ad> {
  const { data } = await api.post<{ ad: Ad }>('/api/ads', payload);
  return data.ad;
}

export async function adminUpdateAd(id: string, payload: Partial<AdInput>): Promise<Ad> {
  const { data } = await api.put<{ ad: Ad }>(`/api/ads/${id}`, payload);
  return data.ad;
}

export async function adminDeleteAd(id: string): Promise<void> {
  await api.delete(`/api/ads/${id}`);
}

export async function adminToggleAd(id: string, enabled: boolean): Promise<Ad> {
  const { data } = await api.post<{ ad: Ad }>(`/api/ads/${id}/toggle`, { enabled });
  return data.ad;
}

export async function adminGetAdMetrics(id: string): Promise<AdMetrics> {
  const { data } = await api.get<{ metrics: AdMetrics }>(`/api/ads/${id}/metrics`);
  return data.metrics;
}

export async function adminGetUploadUrl(bucket: string, path: string): Promise<string> {
  const { data } = await api.get<{ uploadUrl: string }>('/api/ads/upload/url', {
    params: { bucket, path },
  });
  return data.uploadUrl;
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  action: string;
  target: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogListResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export async function adminGetAuditLogs(params?: {
  search?: string;
  action?: string;
  target?: string;
  page?: number;
}): Promise<AuditLogListResponse> {
  const query: Record<string, string | number> = {};
  if (params?.search) query.search = params.search;
  if (params?.action) query.action = params.action;
  if (params?.target) query.target = params.target;
  if (params?.page) query.page = params.page;
  const { data } = await api.get<AuditLogListResponse>('/api/ads/audit-logs', { params: query });
  return data;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const AD_POSITIONS: AdPosition[] = ['HOMEPAGE', 'SIDEBAR', 'BETWEEN_ARTICLES', 'FOOTER', 'CATEGORY'];

export const AD_PROVIDERS = ['adsense', 'custom_banner'];

export async function uploadAdBanner(file: File): Promise<string> {
  const headers = await getAuthHeaders();
  const supabase = (await import('../lib/supabaseClient')).supabase;
  if (!supabase) throw new Error('Supabase client is not initialized');

  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage.from('media').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
  return urlData.publicUrl;
}
