import type { Ad } from '@prisma/client';
import type { AdRenderPayload } from './index.js';

const AD_SENSE_PUBLISHER_ID = process.env.ADSENSE_PUBLISHER_ID;

export function getAdSensePayload(ad: Ad): AdRenderPayload {
  const providerData = ad.providerData as Record<string, unknown> | undefined;
  const placementKey = providerData?.placementKey as string | undefined;

  if (!placementKey) {
    throw new Error('AdSense placement key is required for AdSense ads');
  }

  if (!AD_SENSE_PUBLISHER_ID) {
    throw new Error('Missing environment variable ADSENSE_PUBLISHER_ID for AdSense integration');
  }

  return {
    id: ad.id,
    position: ad.position,
    priority: ad.priority,
    provider: ad.provider,
    creativeType: 'adsense',
    bannerUrl: ad.bannerUrl ?? undefined,
    clickUrl: ad.clickUrl ?? undefined,
    altText: ad.altText ?? undefined,
    providerPayload: {
      publisherId: AD_SENSE_PUBLISHER_ID,
      placementKey,
      adUnitPath: `/${AD_SENSE_PUBLISHER_ID}/${placementKey}`
    }
  };
}
