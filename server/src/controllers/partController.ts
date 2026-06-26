import { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { authGuard } from '../middleware/authGuard.js';

interface PartInput {
  title: string;
  number: number;
  novelId: string;
}

interface ReorderInput {
  partId: string;
  newNumber: number;
}

interface MoveChapterInput {
  chapterId: string;
  partId: string | null;
  newNumber: number;
}

export async function getPartsByNovel(req: Request, res: Response) {
  const { novelId } = req.params;
  const parts = await prisma.part.findMany({
    where: { novelId },
    include: {
      chapters: {
        orderBy: { number: 'asc' },
      },
    },
    orderBy: { number: 'asc' },
  });
  res.json({ parts });
}

export async function createPart(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { title, number, novelId } = req.body as PartInput;

  if (!title || !novelId || number === undefined) {
    res.status(400).json({ error: 'Title, number, and novelId are required' });
    return;
  }

  const part = await prisma.part.create({
    data: {
      title,
      number,
      novelId,
    },
  });

  res.json({ part });
}

export async function updatePart(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { partId } = req.params;
  const { title, number } = req.body as Partial<PartInput>;

  const updateData: { title?: string; number?: number } = {};
  if (title) updateData.title = title;
  if (number !== undefined) updateData.number = number;

  const part = await prisma.part.update({
    where: { id: partId },
    data: updateData,
  });

  res.json({ part });
}

export async function deletePart(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { partId } = req.params;
  const { moveToPartId } = req.body as { moveToPartId?: string | null };

  // Check if there are chapters in this part
  const chaptersInPart = await prisma.chapter.findMany({
    where: { partId },
    select: { id: true },
  });

  if (chaptersInPart.length > 0) {
    if (!moveToPartId && moveToPartId !== null) {
      // Return info about chapters so client can decide
      const otherParts = await prisma.part.findMany({
        where: { novelId: (await prisma.part.findUnique({ where: { id: partId } }))?.novelId },
        select: { id: true, title: true, number: true },
      });
      res.status(409).json({
        error: 'Part has chapters',
        chapterCount: chaptersInPart.length,
        otherParts: otherParts.filter((p) => p.id !== partId),
      });
      return;
    }

    // Move chapters to another part (or unassign if moveToPartId is null)
    await prisma.chapter.updateMany({
      where: { partId },
      data: { partId: moveToPartId },
    });
  }

  await prisma.part.delete({
    where: { id: partId },
  });

  res.json({ success: true });
}

export async function reorderPart(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { partId } = req.params;
  const { newNumber } = req.body as ReorderInput;

  // Get the current part to find its novel and old number
  const currentPart = await prisma.part.findUnique({ where: { id: partId } });
  if (!currentPart) {
    res.status(404).json({ error: 'Part not found' });
    return;
  }

  const oldNumber = currentPart.number;
  const novelId = currentPart.novelId;

  if (newNumber === oldNumber) {
    // No change needed
    res.json({ part: currentPart });
    return;
  }

  // Update parts in a transaction to maintain order
  if (newNumber > oldNumber) {
    // Moving down: decrement numbers between old and new
    await prisma.$transaction([
      prisma.part.update({
        where: { id: partId },
        data: { number: newNumber },
      }),
      prisma.part.updateMany({
        where: {
          novelId,
          number: { gt: oldNumber, lte: newNumber },
        },
        data: { number: { decrement: 1 } },
      }),
    ]);
  } else {
    // Moving up: increment numbers between new and old
    await prisma.$transaction([
      prisma.part.update({
        where: { id: partId },
        data: { number: newNumber },
      }),
      prisma.part.updateMany({
        where: {
          novelId,
          number: { gte: newNumber, lt: oldNumber },
        },
        data: { number: { increment: 1 } },
      }),
    ]);
  }

  const part = await prisma.part.findUnique({ where: { id: partId } });
  res.json({ part });
}

export async function moveChapter(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { chapterId } = req.params;
  const { partId, newNumber } = req.body as MoveChapterInput;

  const chapter = await prisma.chapter.update({
    where: { id: chapterId },
    data: {
      partId: partId || null,
      number: newNumber,
    },
  });

  res.json({ chapter });
}

export async function reorderChapters(req: Request, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { partId } = req.params;
  const { chapterOrders } = req.body as { chapterOrders: Array<{ id: string; number: number }> };

  // Update all chapters in a transaction
  await prisma.$transaction(
    chapterOrders.map((ch) =>
      prisma.chapter.update({
        where: { id: ch.id },
        data: { number: ch.number },
      })
    )
  );

  res.json({ success: true });
}