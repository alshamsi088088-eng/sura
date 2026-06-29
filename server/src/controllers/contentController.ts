
import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

export async function homeContent(_req: Request, res: Response) {
  let client = null;
  try {
    // Get client from Prisma's connection pool
    client = prisma;
    // Use a timeout wrapper for the query with explicit error handling
    const featured = await Promise.race([
      client.article.findMany({
        where: { featured: true },
        take: 4,
        orderBy: { publishedAt: 'desc' },
        // Explicitly select fields to avoid undefined field errors
        select: {
          title: true,
          excerpt: true,
          publishedAt: true
        }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      )
    ]);
    res.json({ featured: featured.map((item: any) => ({ title: item.title, description: item.excerpt })) });
  } catch (error: any) {
    console.error('homeContent error:', error.message);
    // Return 503 if it's a database connection issue
    if (error.message?.includes('timeout') || error.message?.includes('prisma')) {
      res.status(503).json({ message: 'Service temporarily unavailable', error: error.message });
    } else {
      res.status(500).json({ message: 'Failed to fetch home content', error: error.message });
    }
  }
}

export async function getArticles(_req: Request, res: Response) {
  const articles = await prisma.article.findMany({ orderBy: { publishedAt: 'desc' } });
  res.json({ articles: articles.map((article: any) => ({ id: article.id, title: article.title, excerpt: article.excerpt, category: article.category, language: article.language, readingTime: article.readingTime, author: article.authorName, views: article.views, claps: article.claps })) });
}

export async function getNovels(_req: Request, res: Response) {
  const novels = await prisma.novel.findMany({
    include: {
      chapters: { orderBy: { number: 'asc' } }
    }
  });
  // Parts will be fetched separately - backend returns chapters with partId for grouping
  res.json({ novels });
}

export async function getGallery(_req: Request, res: Response) {
  const items = await prisma.galleryImage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ items: items.map((item: any) => ({ id: item.id, title: item.title, category: item.category, image: item.imageUrl })) });
}

export async function getTech(_req: Request, res: Response) {
  const articles = await prisma.techArticle.findMany({ orderBy: { publishedAt: 'desc' } });
  res.json({ articles: articles.map((article: any) => ({
    id: article.id,
    title: article.title,
    series: article.series,
    tags: article.tags.split(','),
    excerpt: article.excerpt,
    code: article.code
  })) });
}

export async function getProducts(_req: Request, res: Response) {
  // In this codebase “products” for the store are represented by the Book model.
  // Prisma “Product” model might not exist depending on schema migrations.
  const products = await prisma.book.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ products });
}


export async function getDashboard(req: Request, res: Response) {
  const user = req.user;
  const history = [
    'Read a new short story',
    'Saved an article to bookmarks',
    'Viewed a new chapter',
    'Completed a digital purchase'
  ];
  res.json({ history, user });
}
