import { prisma } from './prisma';

export type SitemapEntry = {
  id: string;
  changefreq: string;
  priority: number;
};

export type StaticPageEntry = {
  path: string;
  changefreq: string;
  priority: number;
};

function safeId(input: unknown) {
  if (input === null || input === undefined) return '';
  return String(input);
}

export async function getArticlesForSitemap(): Promise<Array<{ id: string; slug?: string; updatedAt?: string; changefreq: string; priority: number }>> {
  try {
    const rows = await prisma.article.findMany({
      select: { id: true, slug: true, updatedAt: true, createdAt: true, publishedAt: true },
      take: 5000,
      orderBy: { publishedAt: 'desc' },
    });

    return rows
      .map((r) => ({
        id: safeId(r.id),
        slug: r.slug || undefined,
        updatedAt: (r.updatedAt || r.createdAt || r.publishedAt)?.toISOString?.() || undefined,
        changefreq: 'weekly' as const,
        priority: 0.7,
      }))
      .filter((x) => x.id);
  } catch {
    return [];
  }
}

export async function getNovelsForSitemap(): Promise<Array<{ id: string; updatedAt?: string; changefreq: string; priority: number }>> {
  try {
    const rows = await prisma.novel.findMany({
      select: { id: true, updatedAt: true, createdAt: true },
      take: 5000,
      orderBy: { createdAt: 'desc' },
    });

    return rows
      .map((r) => ({
        id: safeId(r.id),
        updatedAt: (r.updatedAt || r.createdAt)?.toISOString?.() || undefined,
        changefreq: 'weekly' as const,
        priority: 0.65,
      }))
      .filter((x) => x.id);
  } catch {
    return [];
  }
}

export async function getCommunityThreadsForSitemap(): Promise<Array<{ id: string; updatedAt?: string; changefreq: string; priority: number }>> {
  try {
    const rows = await prisma.communityThread.findMany({
      select: { id: true, updatedAt: true, createdAt: true },
      take: 5000,
      orderBy: { updatedAt: 'desc' },
    });

    return rows
      .map((r) => ({
        id: safeId(r.id),
        updatedAt: (r.updatedAt || r.createdAt)?.toISOString?.() || undefined,
        changefreq: 'weekly' as const,
        priority: 0.6,
      }))
      .filter((x) => x.id);
  } catch {
    return [];
  }
}

export async function getSeriesForSitemap(): Promise<Array<{ id: string; slug?: string; updatedAt?: string; changefreq: string; priority: number }>> {
  try {
    const rows = await prisma.series.findMany({
      select: { id: true, slug: true, updatedAt: true, createdAt: true },
      take: 5000,
      orderBy: { createdAt: 'desc' },
    });

    return rows
      .map((r) => ({
        id: safeId(r.id),
        slug: r.slug || undefined,
        updatedAt: (r.updatedAt || r.createdAt)?.toISOString?.() || undefined,
        changefreq: 'weekly' as const,
        priority: 0.7,
      }))
      .filter((x) => x.id);
  } catch {
    return [];
  }
}

export async function getStaticPagesForSitemap(): Promise<StaticPageEntry[]> {
  return [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/articles', changefreq: 'weekly', priority: 0.8 },
    { path: '/novels', changefreq: 'weekly', priority: 0.75 },
    { path: '/gallery', changefreq: 'weekly', priority: 0.6 },
    { path: '/store', changefreq: 'weekly', priority: 0.6 },
    { path: '/tech', changefreq: 'weekly', priority: 0.55 },
    { path: '/products', changefreq: 'weekly', priority: 0.5 },
    { path: '/community', changefreq: 'weekly', priority: 0.6 },
    { path: '/about', changefreq: 'monthly', priority: 0.4 },
    { path: '/contact', changefreq: 'monthly', priority: 0.35 },
    { path: '/privacy', changefreq: 'monthly', priority: 0.35 },
    { path: '/terms-of-service', changefreq: 'monthly', priority: 0.35 },
    { path: '/cookie-policy', changefreq: 'monthly', priority: 0.3 },
  ];
}
