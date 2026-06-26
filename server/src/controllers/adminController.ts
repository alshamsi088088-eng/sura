
import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

export async function getOverview(_req: Request, res: Response) {
  const users = await prisma.user.count();
  const orders = await prisma.order.count();
  const revenueData = await prisma.order.findMany({ select: { total: true } });
  const revenue = revenueData.reduce((sum: number, order: { total: number }) => sum + order.total, 0).toFixed(2);
  const traffic = [
    { day: 'Mon', visitors: 150 },
    { day: 'Tue', visitors: 190 },
    { day: 'Wed', visitors: 210 },
    { day: 'Thu', visitors: 180 },
    { day: 'Fri', visitors: 220 },
    { day: 'Sat', visitors: 240 },
    { day: 'Sun', visitors: 260 }
  ];
  res.json({ users, revenue, traffic, orders });
}

// ===== Article Admin Operations =====

export async function updateArticle(req: Request, res: Response) {
  const { id } = req.params;
  const { title, slug, excerpt, content, category, language, readingTime, authorName, featured } = req.body;

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(excerpt && { excerpt }),
      ...(content && { content }),
      ...(category && { category }),
      ...(language && { language }),
      ...(readingTime && { readingTime }),
      ...(authorName && { authorName }),
      ...(featured !== undefined && { featured }),
    },
  });

  res.json(article);
}

export async function deleteArticle(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.article.delete({ where: { id } });
  res.json({ success: true, message: 'Article deleted' });
}

// ===== Novel Admin Operations =====

export async function updateNovel(req: Request, res: Response) {
  const { id } = req.params;
  const { title, slug, description, coverImage, authorName } = req.body;

  const novel = await prisma.novel.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(description && { description }),
      ...(coverImage && { coverImage }),
      ...(authorName && { authorName }),
    },
  });

  res.json(novel);
}

export async function deleteNovel(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.novel.delete({ where: { id } });
  res.json({ success: true, message: 'Novel deleted' });
}

// ===== Chapter Admin Operations =====

export async function updateChapter(req: Request, res: Response) {
  const { id } = req.params;
  const { title, number, content, readingTime, partId } = req.body;

  const chapter = await prisma.chapter.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(number && { number }),
      ...(content && { content }),
      ...(readingTime && { readingTime }),
      ...(partId !== undefined && { partId }),
    },
  });

  res.json(chapter);
}

export async function deleteChapter(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.chapter.delete({ where: { id } });
  res.json({ success: true, message: 'Chapter deleted' });
}

// ===== Comment Admin Operations =====

export async function deleteComment(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.comment.delete({ where: { id } });
  res.json({ success: true, message: 'Comment deleted' });
}

// ===== Book Admin Operations =====

export async function deleteBook(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.book.delete({ where: { id } });
  res.json({ success: true, message: 'Book deleted' });
}

// ===== Gallery Admin Operations =====

export async function deleteGalleryImage(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.galleryImage.delete({ where: { id } });
  res.json({ success: true, message: 'Gallery image deleted' });
}
