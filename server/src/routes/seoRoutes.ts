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

seoRouter.get('/robots.txt', (_req, res) => {
  const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://sura-codex.com').replace(/\/$/, '');
  res.type('text/plain').send(
    `User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard
Disallow: /admin
Disallow: /profile
Disallow: /library
Disallow: /create-post
Disallow: /create-chapter
Disallow: /create-novel
Disallow: /create-tech
Disallow: /edit-parts
Disallow: /login
Disallow: /register

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

`
  );
});

seoRouter.get('/sitemap.xml', async (req, res) => {
  const baseUrl = (process.env.PUBLIC_BASE_URL || '').trim();
  // If baseUrl is missing, return relative URLs (valid for some crawlers, but less ideal)
  const base = baseUrl || '';

  const [articles, novels, staticPages] = await Promise.all([
    getArticlesForSitemap(),
    getNovelsForSitemap(),
    getStaticPagesForSitemap(),
  ]);

  const staticUrlEntries = staticPages.map((p) => ({ loc: p.path, changefreq: p.changefreq, priority: p.priority }));
  // Client route is /articles/:slug
  const articleUrlEntries = articles.map((a) => ({
    loc: `/articles/${a.slug || a.id}`,
    changefreq: a.changefreq,
    priority: a.priority,
  }));

  // Client uses /novels/:id (verify in App routes). If it ever becomes slug-based, update accordingly.
  const novelUrlEntries = novels.map((n) => ({
    loc: `/novels/${n.id}`,
    changefreq: n.changefreq,
    priority: n.priority,
  }));



  const urls = [...staticUrlEntries, ...articleUrlEntries, ...novelUrlEntries];

  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const loc = base ? toAbsoluteUrl(base, u.loc) : u.loc;
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(now)}</lastmod>
    <changefreq>${escapeXml(u.changefreq)}</changefreq>
    <priority>${escapeXml(String(u.priority))}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

