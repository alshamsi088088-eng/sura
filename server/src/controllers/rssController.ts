import { Request, Response } from 'express';
import RSS from 'rss';
import { prisma } from '../services/prisma.js';

/** Runtime type for RSS article rows to handle Prisma generated types safely */
type RssArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  publishedAt: Date | null;
  authorName: string;
  coverImage: string | null;
};

export async function rssFeed(req: Request, res: Response) {
  try {
    const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://sura-codex.com').replace(/\/$/, '');

    const rawArticles = await prisma.article.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        authorName: true,
        coverImage: true,
      },
    });

    const articles = rawArticles as RssArticleRow[];

    const feed = new RSS({
      title: 'Sura Codex',
      description: 'A Space for Thought & Creativity — Articles, essays, and novels from Sura Codex.',
      feed_url: `${baseUrl}/api/rss`,
      site_url: baseUrl,
      language: 'en',
      pubDate: new Date().toISOString(),
      ttl: 60,
      custom_namespaces: {
        content: 'http://purl.org/rss/1.0/modules/content/',
        dc: 'http://purl.org/dc/elements/1.1/',
      },
    });

    for (const article of articles) {
      const articleUrl = `${baseUrl}/articles/${encodeURIComponent(article.slug || article.id)}`;
      const customElements: Record<string, unknown>[] = [
        { 'content:encoded': { _cdata: article.content || '' } },
        { 'dc:creator': article.authorName || 'Sura Codex' },
      ];

      // Add coverImage as an RSS enclosure if available
      const coverImageUrl: string | null = article.coverImage;
      if (coverImageUrl) {
        const imageExt = coverImageUrl.split('.').pop()?.toLowerCase() || '';
        const mimeType = ['png', 'gif', 'webp', 'svg'].includes(imageExt)
          ? `image/${imageExt === 'svg' ? 'svg+xml' : imageExt}`
          : 'image/jpeg';
        customElements.push({
          enclosure: {
            _attr: {
              url: coverImageUrl,
              length: 0,
              type: mimeType,
            },
          },
        });
      }

      feed.item({
        title: article.title,
        description: article.excerpt || article.content?.slice(0, 300) || '',
        url: articleUrl,
        guid: articleUrl,
        date: article.publishedAt?.toISOString() || new Date().toISOString(),
        author: article.authorName || 'Sura Codex',
        categories: ['Article'],
        custom_elements: customElements,
      });
    }

    res.type('application/rss+xml').send(feed.xml({ indent: true }));
  } catch (error) {
    console.error('RSS feed generation failed:', error);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
}

