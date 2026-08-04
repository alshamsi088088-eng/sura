import { Ad, AdPosition } from '@prisma/client';
import { getAdSensePayload } from './adsenseProvider.js';
import { getCustomBannerPayload } from './customBannerProvider.js';

export type AdRenderPayload = {
  id: string;
  position: AdPosition;
  priority: number;
  provider: string;
  creativeType: 'adsense' | 'banner' | 'custom';
  bannerUrl?: string;
  clickUrl?: string;
  altText?: string;
  providerPayload: Record<string, unknown>;
};

export type ProviderAdapter = {
  getRenderPayload(ad: Ad): AdRenderPayload;
};

const PROVIDER_REGISTRY: Record<string, ProviderAdapter> = {
  adsense: { getRenderPayload: getAdSensePayload },
  custom_banner: { getRenderPayload: getCustomBannerPayload }
};

export function getProviderAdapter(provider: string): ProviderAdapter {
  const adapter = PROVIDER_REGISTRY[provider];
  if (!adapter) {
    throw new Error(`Unsupported ad provider: ${provider}`);
  }
  return adapter;
}

export function registerProviderAdapter(provider: string, adapter: ProviderAdapter) {
  PROVIDER_REGISTRY[provider] = adapter;
}
