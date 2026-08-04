import { prisma } from './prisma.js';
import { AdPosition, Prisma } from '@prisma/client';
import { getProviderAdapter, AdRenderPayload } from './adProviders/index.js';

export type AdFilter = {
  search?: string;
  position?: string;
  enabled?: boolean;
};

export type AdTrackEvent = {
  adId: string;
  type: 'impression' | 'click';
  meta?: Prisma.JsonValue | null;
};

export async function createAd(data: {
  title: string;
  provider: string;
  providerData?: Prisma.JsonValue;
  position: AdPosition;
  priority?: number;
  targeting?: Prisma.JsonValue;
  startAt?: Date;
  endAt?: Date;
  enabled?: boolean;
  bannerUrl?: string;
  clickUrl?: string;
  altText?: string;
  createdBy: string;
}) {
  return prisma.ad.create({
    data: {
      title: data.title,
      provider: data.provider,
      providerData: data.providerData,
      position: data.position,
      priority: data.priority ?? 0,
      targeting: data.targeting,
      startAt: data.startAt,
      endAt: data.endAt,
      enabled: data.enabled ?? true,
      bannerUrl: data.bannerUrl,
      clickUrl: data.clickUrl,
      altText: data.altText,
      createdBy: data.createdBy
    }
  });
}

export async function updateAd(id: string, data: Partial<{
  title: string;
  provider: string;
  providerData: Prisma.JsonValue | null;
  position: AdPosition;
  priority: number;
  targeting: Prisma.JsonValue | null;
  startAt: Date;
  endAt: Date;
  enabled: boolean;
  bannerUrl: string | null;
  clickUrl: string | null;
  altText: string | null;
}>) {
  return prisma.ad.update({
    where: { id },
    data: {
      title: data.title,
      provider: data.provider,
      providerData: data.providerData,
      position: data.position,
      priority: data.priority,
      targeting: data.targeting,
      startAt: data.startAt,
      endAt: data.endAt,
      enabled: data.enabled,
      bannerUrl: data.bannerUrl,
      clickUrl: data.clickUrl,
      altText: data.altText
    }
  });
}

export async function getAdById(id: string) {
  return prisma.ad.findUnique({ where: { id } });
}

export async function listAds(filter: AdFilter, page = 1, limit = 20) {
  const where: any = {};

  if (filter.search) {
    where.title = { contains: filter.search, mode: 'insensitive' };
  }

  if (filter.enabled !== undefined) {
    where.enabled = filter.enabled;
  }

  if (filter.position) {
    where.position = filter.position as AdPosition;
  }

  const [total, ads] = await Promise.all([
    prisma.ad.count({ where }),
    prisma.ad.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    })
  ]);

  return {
    ads,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

export async function deleteAd(id: string) {
  return prisma.ad.delete({ where: { id } });
}

export async function setAdEnabled(id: string, enabled: boolean) {
  return prisma.ad.update({ where: { id }, data: { enabled } });
}

export async function trackAdEvent(event: AdTrackEvent) {
  return prisma.adMetric.create({
    data: {
      adId: event.adId,
      type: event.type,
      meta: event.meta ?? null
    }
  });
}

export async function getAdMetrics(id: string) {
  const metrics = await prisma.adMetric.groupBy({
    by: ['type'],
    where: { adId: id },
    _count: { _all: true }
  });

  const result: Record<string, number> = {};
  metrics.forEach((row) => {
    result[row.type] = row._count._all;
  });

  return result;
}

export async function findAdsForSlot(position: string, category?: string, locale?: string) {
  const now = new Date();
  const predicate: any = {
    enabled: true,
    position: position as AdPosition,
    AND: [
      { OR: [{ startAt: null }, { startAt: { lte: now } }] },
      { OR: [{ endAt: null }, { endAt: { gte: now } }] }
    ]
  };

  const ads = await prisma.ad.findMany({
    where: predicate,
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    take: 10
  });

  const filtered = ads.filter((ad) => {
    if (!ad.targeting) return true;
    const targeting = ad.targeting as Record<string, unknown>;

    if (category && typeof targeting.category === 'string') {
      const allowed = (targeting.category as string).split(',').map((item) => item.trim().toLowerCase());
      if (!allowed.includes(category.toLowerCase())) return false;
    }

    if (locale && typeof targeting.locale === 'string') {
      const allowed = (targeting.locale as string).split(',').map((item) => item.trim().toLowerCase());
      if (!allowed.includes(locale.toLowerCase())) return false;
    }

    if (targeting.locations && Array.isArray(targeting.locations) && locale) {
      const locationAllowed = (targeting.locations as string[]).map((item) => item.toLowerCase());
      if (!locationAllowed.includes(locale.toLowerCase())) return false;
    }

    return true;
  });

  const payloads: AdRenderPayload[] = filtered.map((ad) => {
    const adapter = getProviderAdapter(ad.provider);
    return adapter.getRenderPayload(ad);
  });

  return payloads;
}
