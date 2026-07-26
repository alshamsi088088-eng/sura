import { Router } from 'express';
import {
  getArticlesForSitemap,
  getNovelsForSitemap,
  getCommunityThreadsForSitemap,
  getStaticPagesForSitemap,
} from '../services/sitemapService';


export const seoRouter = Router();

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\"/g, '"')
    .replace(/'/g, '&apos;');
}

function toAbsoluteUrl(baseUrl: string, path: string) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

// robots.txt is served statically from client/public/robots.txt
// (Dynamic generation removed — static file provides full directives)




seoRouter.get('/sitemap.xml', async (req, res) => {
  const baseUrl = (process.env.PUBLIC_BASE_URL || '').trim();
  // If baseUrl is missing, return relative URLs (valid for some crawlers, but less ideal)
  const base = baseUrl || '';

  const [articles, novels, communityThreads, staticPages] = await Promise.all([
    getArticlesForSitemap(),
    getNovelsForSitemap(),
    getCommunityThreadsForSitemap(),
    getStaticPagesForSitemap(),
  ]);

  const staticUrlEntries = staticPages.map((p) => ({
    loc: p.path,
    lastmod: undefined as string | undefined,
    changefreq: p.changefreq,
    priority: p.priority,
  }));

  const articleUrlEntries = articles.map((a) => ({
    loc: `/articles/${a.slug || a.id}`,
    lastmod: a.updatedAt,
    changefreq: a.changefreq,
    priority: a.priority,
  }));

  const novelUrlEntries = novels.map((n) => ({
    loc: `/novels/${n.id}`,
    lastmod: n.updatedAt,
    changefreq: n.changefreq,
    priority: n.priority,
  }));

  const communityUrlEntries = communityThreads.map((t) => ({
    loc: `/community/thread/${t.id}`,
    lastmod: t.updatedAt,
    changefreq: t.changefreq,
    priority: t.priority,
  }));

  const urls = [
    ...staticUrlEntries,
    ...articleUrlEntries,
    ...novelUrlEntries,
    ...communityUrlEntries,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const loc = base ? toAbsoluteUrl(base, u.loc) : u.loc;
    const lastmod = u.lastmod ? `\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : '';
    return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod}
    <changefreq>${escapeXml(u.changefreq)}</changefreq>
    <priority>${escapeXml(String(u.priority))}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

