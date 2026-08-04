import type { Ad } from '@prisma/client';
import type { AdRenderPayload } from './index.js';

export function getCustomBannerPayload(ad: Ad): AdRenderPayload {
  if (!ad.bannerUrl) {
    throw new Error('Custom banner ads must provide a bannerUrl');
  }

  return {
    id: ad.id,
    position: ad.position,
    priority: ad.priority,
    provider: ad.provider,
    creativeType: 'banner',
    bannerUrl: ad.bannerUrl,
    clickUrl: ad.clickUrl ?? undefined,
    altText: ad.altText ?? undefined,
    providerPayload: {
      layout: 'image',
      width: providerDataWidth(ad.providerData),
      height: providerDataHeight(ad.providerData)
    }
  };
}

function providerDataWidth(providerData: unknown) {
  if (!providerData || typeof providerData !== 'object') return undefined;
  const value = (providerData as Record<string, unknown>).width;
  return typeof value === 'number' ? value : undefined;
}

function providerDataHeight(providerData: unknown) {
  if (!providerData || typeof providerData !== 'object') return undefined;
  const value = (providerData as Record<string, unknown>).height;
  return typeof value === 'number' ? value : undefined;
}
