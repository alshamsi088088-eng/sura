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

export async function getArticlesForSitemap(): Promise<Array<{ id: string; slug?: string; changefreq: string; priority: number }>> {
  const rows = await (prisma as unknown as {
    article?: { findMany: (args: any) => Promise<Array<{ id: unknown; slug?: unknown }>> };
  }).article?.findMany({
    select: { id: true, slug: true },
    take: 5000,
    orderBy: { publishedAt: 'desc' },
  } as any);

  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows
    .map((r) => ({
      id: safeId((r as any).id),
      slug: safeId((r as any).slug) || undefined,
      changefreq: 'weekly',
      priority: 0.7,
    }))
    .filter((x) => x.id);
}

export async function getNovelsForSitemap(): Promise<SitemapEntry[]> {
  const rows = await (prisma as unknown as {
    novel?: { findMany: (args: any) => Promise<Array<{ id: unknown }>> };
  }).novel?.findMany({
    select: { id: true },
    take: 5000,
    orderBy: { createdAt: 'desc' },
  } as any);

  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows
    .map((r) => ({
      id: safeId((r as any).id),
      changefreq: 'weekly',
      priority: 0.65,
    }))
    .filter((x) => x.id);
}

export async function getStaticPagesForSitemap(): Promise<StaticPageEntry[]> {
  return [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/articles', changefreq: 'weekly', priority: 0.8 },
    { path: '/novels', changefreq: 'weekly', priority: 0.75 },
    { path: '/store', changefreq: 'weekly', priority: 0.6 },
    { path: '/about', changefreq: 'monthly', priority: 0.4 },
    { path: '/contact', changefreq: 'monthly', priority: 0.35 },
    { path: '/privacy', changefreq: 'monthly', priority: 0.35 },
    { path: '/terms-of-service', changefreq: 'monthly', priority: 0.35 },
    { path: '/tech', changefreq: 'weekly', priority: 0.55 },
    { path: '/products', changefreq: 'weekly', priority: 0.5 },
  ];
}


