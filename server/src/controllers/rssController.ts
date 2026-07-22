import { Request, Response } from 'express';
import RSS from 'rss';
import { prisma } from '../services/prisma.js';

export async function rssFeed(req: Request, res: Response) {
  try {
    const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://sura-codex.com').replace(/\/$/, '');

    const articles = await prisma.article.findMany({
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
      },
    });

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
      feed.item({
        title: article.title,
        description: article.excerpt || article.content?.slice(0, 300) || '',
        url: articleUrl,
        guid: articleUrl,
        date: article.publishedAt?.toISOString() || new Date().toISOString(),
        author: article.authorName || 'Sura Codex',
        categories: ['Article'],
        custom_elements: [
          { 'content:encoded': { _cdata: article.content || '' } },
          { 'dc:creator': article.authorName || 'Sura Codex' },
        ],
        // TODO: Add enclosure with coverImage when the Article model includes a coverImage field
      });
    }

    res.type('application/rss+xml').send(feed.xml({ indent: true }));
  } catch (error) {
    console.error('RSS feed generation failed:', error);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
}
