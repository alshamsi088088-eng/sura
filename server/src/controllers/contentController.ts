
import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

export async function homeContent(_req: Request, res: Response) {
  const featured = await prisma.article.findMany({ where: { featured: true }, take: 4, orderBy: { publishedAt: 'desc' } });
  res.json({ featured: featured.map((item: any) => ({ title: item.title, description: item.excerpt })) });
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
