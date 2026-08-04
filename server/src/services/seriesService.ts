import { prisma } from './prisma.js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SeriesListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string | null;
  estimatedReadingTime: string;
  difficulty: string;
  category: string;
  authorName: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  progress?: number; // 0 | 25 | 50 | 75 | 100
}

export interface SeriesDetail extends SeriesListItem {
  items: Array<{
    id: string;
    seriesItemId: string;
    contentType: string;
    contentId: string;
    order: number;
    title: string;
    slug: string;
    readingTime: string;
    completed: boolean;
    progress: number;
  }>;
}

export interface SeriesProgressInfo {
  totalItems: number;
  completedItems: number;
  progress: number; // 0 | 25 | 50 | 75 | 100
  nextItem: { seriesItemId: string; contentType: string; contentId: string; title: string; slug: string } | null;
  previousItem: { seriesItemId: string; contentType: string; contentId: string; title: string; slug: string } | null;
  continueItem: { seriesItemId: string; contentType: string; contentId: string; title: string; slug: string } | null;
  completed: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function clampProgress(pct: number): number {
  if (pct >= 100) return 100;
  if (pct >= 75) return 75;
  if (pct >= 50) return 50;
  if (pct >= 25) return 25;
  return 0;
}

async function getContentTitleAndSlug(
  contentType: string,
  contentId: string
): Promise<{ title: string; slug: string; readingTime: string }> {
  if (contentType === 'article') {
    const article = await prisma.article.findUnique({
      where: { id: contentId },
      select: { title: true, slug: true, readingTime: true },
    });
    return {
      title: article?.title || 'Untitled',
      slug: article?.slug || '',
      readingTime: article?.readingTime || '',
    };
  }
  if (contentType === 'chapter') {
    const chapter = await prisma.chapter.findUnique({
      where: { id: contentId },
      select: { title: true, readingTime: true },
    });
    return {
      title: chapter?.title || 'Untitled',
      slug: '',
      readingTime: chapter?.readingTime || '',
    };
  }
  if (contentType === 'novel') {
    const novel = await prisma.novel.findUnique({
      where: { id: contentId },
      select: { title: true, slug: true },
    });
    return {
      title: novel?.title || 'Untitled',
      slug: novel?.slug || '',
      readingTime: '',
    };
  }
  return { title: 'Untitled', slug: '', readingTime: '' };
}

// ─── Public: Get all series ─────────────────────────────────────────────────

export async function getAllSeries(userId?: string): Promise<SeriesListItem[]> {
  const seriesList = await prisma.series.findMany({
    include: {
      items: {
        select: { id: true, contentType: true, contentId: true, order: true },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // If user is logged in, fetch their ReadingHistory for all series items in one query
  let userHistoryMap = new Map<string, number>();
  if (userId) {
    const allContentIds = seriesList.flatMap((s) =>
      s.items.map((i) => i.contentId)
    );
    if (allContentIds.length > 0) {
      // Batch-fetch all reading history for this user across all series items
      const historyRecords = await prisma.readingHistory.findMany({
        where: {
          userId,
          contentId: { in: allContentIds },
        },
        select: { contentId: true, progress: true },
      });
      historyRecords.forEach((r) => {
        userHistoryMap.set(r.contentId, r.progress);
      });
    }
  }

  return seriesList.map((series) => {
    const totalItems = series.items.length;
    let completedItems = 0;
    if (userId && totalItems > 0) {
      series.items.forEach((item) => {
        const progress = userHistoryMap.get(item.contentId) || 0;
        if (progress >= 100) completedItems++;
      });
    }
    const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      id: series.id,
      title: series.title,
      slug: series.slug,
      description: series.description,
      coverImage: series.coverImage,
      estimatedReadingTime: series.estimatedReadingTime,
      difficulty: series.difficulty,
      category: series.category,
      authorName: series.authorName,
      itemCount: totalItems,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      progress: userId ? clampProgress(pct) : undefined,
    };
  });
}

// ─── Public: Get series by slug ─────────────────────────────────────────────

export async function getSeriesBySlug(
  slug: string,
  userId?: string
): Promise<SeriesDetail | null> {
  const series = await prisma.series.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!series) return null;

  // Fetch reading history for all items in one batch
  let userHistoryMap = new Map<string, number>();
  if (userId) {
    const contentIds = series.items.map((i) => i.contentId);
    if (contentIds.length > 0) {
      const historyRecords = await prisma.readingHistory.findMany({
        where: {
          userId,
          contentId: { in: contentIds },
        },
        select: { contentId: true, progress: true },
      });
      historyRecords.forEach((r) => {
        userHistoryMap.set(r.contentId, r.progress);
      });
    }
  }

  // Resolve content titles and slugs
  const items = await Promise.all(
    series.items.map(async (item) => {
      const { title, slug, readingTime } = await getContentTitleAndSlug(
        item.contentType,
        item.contentId
      );
      const progress = userId ? userHistoryMap.get(item.contentId) || 0 : 0;
      return {
        id: item.contentId,
        seriesItemId: item.id,
        contentType: item.contentType,
        contentId: item.contentId,
        order: item.order,
        title,
        slug,
        readingTime,
        completed: progress >= 100,
        progress,
      };
    })
  );

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return {
    id: series.id,
    title: series.title,
    slug: series.slug,
    description: series.description,
    coverImage: series.coverImage,
    estimatedReadingTime: series.estimatedReadingTime,
    difficulty: series.difficulty,
    category: series.category,
    authorName: series.authorName,
    itemCount: totalItems,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
    progress: clampProgress(pct),
    items,
  };
}

// ─── Public: Get series progress ────────────────────────────────────────────

export async function getSeriesProgress(
  seriesId: string,
  userId: string
): Promise<SeriesProgressInfo> {
  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: {
      items: {
        orderBy: { order: 'asc' },
        select: { id: true, contentType: true, contentId: true, order: true },
      },
    },
  });

  if (!series) {
    throw new Error('Series not found');
  }

  const totalItems = series.items.length;
  if (totalItems === 0) {
    return {
      totalItems: 0,
      completedItems: 0,
      progress: 0,
      nextItem: null,
      previousItem: null,
      continueItem: null,
      completed: true,
    };
  }

  // Fetch reading history for all items
  const contentIds = series.items.map((i) => i.contentId);
  const historyRecords = await prisma.readingHistory.findMany({
    where: { userId, contentId: { in: contentIds } },
    select: { contentId: true, progress: true },
  });
  const historyMap = new Map(historyRecords.map((r) => [r.contentId, r.progress]));

  // Build enriched items with resolved titles
  const enrichedItems = await Promise.all(
    series.items.map(async (item) => {
      const { title, slug } = await getContentTitleAndSlug(item.contentType, item.contentId);
      const progress = historyMap.get(item.contentId) || 0;
      return {
        seriesItemId: item.id,
        contentType: item.contentType,
        contentId: item.contentId,
        order: item.order,
        title,
        slug,
        progress,
      };
    })
  );

  const completedItems = enrichedItems.filter((i) => i.progress >= 100).length;
  const pct = Math.round((completedItems / totalItems) * 100);

  // Previous item: last completed item
  const completed = enrichedItems
    .filter((i) => i.progress >= 100)
    .sort((a, b) => b.order - a.order);
  const previousItem = completed.length > 0 ? completed[0] : null;

  // Next item: first uncompleted (progress < 100)
  const nextItem = enrichedItems.find((i) => i.progress < 100) || null;

  // Continue item: first item with 0 < progress < 100
  const continueItem = enrichedItems.find(
    (i) => i.progress > 0 && i.progress < 100
  ) || nextItem; // fallback to next item

  return {
    totalItems,
    completedItems,
    progress: clampProgress(pct),
    nextItem: nextItem
      ? {
          seriesItemId: nextItem.seriesItemId,
          contentType: nextItem.contentType,
          contentId: nextItem.contentId,
          title: nextItem.title,
          slug: nextItem.slug,
        }
      : null,
    previousItem: previousItem
      ? {
          seriesItemId: previousItem.seriesItemId,
          contentType: previousItem.contentType,
          contentId: previousItem.contentId,
          title: previousItem.title,
          slug: previousItem.slug,
        }
      : null,
    continueItem: continueItem
      ? {
          seriesItemId: continueItem.seriesItemId,
          contentType: continueItem.contentType,
          contentId: continueItem.contentId,
          title: continueItem.title,
          slug: continueItem.slug,
        }
      : null,
    completed: completedItems >= totalItems,
  };
}

// ─── Public: Get recommended series ─────────────────────────────────────────

export async function getRecommendedSeries(
  userId?: string,
  category?: string,
  limit = 4
): Promise<SeriesListItem[]> {
  const where: any = {};
  if (category) {
    where.category = category;
  }

  // Exclude series the user has completed
  if (userId) {
    const allSeries = await prisma.series.findMany({
      include: { items: { select: { contentId: true } } },
    });

    const userHistory = await prisma.readingHistory.findMany({
      where: { userId },
      select: { contentId: true, progress: true },
    });
    const historyMap = new Map(userHistory.map((r) => [r.contentId, r.progress]));

    const completedSeriesIds = allSeries
      .filter((s) => {
        if (s.items.length === 0) return false;
        return s.items.every((item) => (historyMap.get(item.contentId) || 0) >= 100);
      })
      .map((s) => s.id);

    where.id = { notIn: completedSeriesIds };
  }

  const seriesList = await prisma.series.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      items: { select: { id: true, contentType: true, contentId: true } },
    },
  });

  // Compute progress for logged-in user
  let userHistoryMap = new Map<string, number>();
  if (userId) {
    const contentIds = seriesList.flatMap((s) => s.items.map((i) => i.contentId));
    if (contentIds.length > 0) {
      const records = await prisma.readingHistory.findMany({
        where: { userId, contentId: { in: contentIds } },
        select: { contentId: true, progress: true },
      });
      records.forEach((r) => userHistoryMap.set(r.contentId, r.progress));
    }
  }

  return seriesList.map((series) => {
    const totalItems = series.items.length;
    let completedItems = 0;
    if (userId && totalItems > 0) {
      series.items.forEach((item) => {
        if ((userHistoryMap.get(item.contentId) || 0) >= 100) completedItems++;
      });
    }
    const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      id: series.id,
      title: series.title,
      slug: series.slug,
      description: series.description,
      coverImage: series.coverImage,
      estimatedReadingTime: series.estimatedReadingTime,
      difficulty: series.difficulty,
      category: series.category,
      authorName: series.authorName,
      itemCount: totalItems,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      progress: userId ? clampProgress(pct) : undefined,
    };
  });
}

// ─── Admin: Create series ───────────────────────────────────────────────────

export async function createSeries(data: {
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  estimatedReadingTime: string;
  difficulty: string;
  category: string;
  authorName: string;
  authorId?: string;
}): Promise<SeriesListItem> {
  const series = await prisma.series.create({ data });
  return {
    id: series.id,
    title: series.title,
    slug: series.slug,
    description: series.description,
    coverImage: series.coverImage,
    estimatedReadingTime: series.estimatedReadingTime,
    difficulty: series.difficulty,
    category: series.category,
    authorName: series.authorName,
    itemCount: 0,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
  };
}

// ─── Admin: Update series ───────────────────────────────────────────────────

export async function updateSeries(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    description: string;
    coverImage: string;
    estimatedReadingTime: string;
    difficulty: string;
    category: string;
    authorName: string;
  }>
) {
  const series = await prisma.series.update({
    where: { id },
    data,
  });
  return series;
}

// ─── Admin: Delete series ───────────────────────────────────────────────────

export async function deleteSeries(id: string) {
  // Cascade delete handles SeriesItem removal
  await prisma.series.delete({ where: { id } });
  return { success: true };
}

// ─── Admin: Reorder items ───────────────────────────────────────────────────

export async function reorderSeriesItems(
  seriesId: string,
  orderedIds: string[] // Array of SeriesItem IDs in new order
) {
  // Validate that all items belong to the series
  const existingItems = await prisma.seriesItem.findMany({
    where: { seriesId },
    select: { id: true },
  });
  const existingIds = new Set(existingItems.map((i) => i.id));
  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      throw new Error(`Item ${id} does not belong to series ${seriesId}`);
    }
  }

  // Update order in a transaction
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.seriesItem.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return { success: true };
}

// ─── Admin: Assign item to series ───────────────────────────────────────────

export async function assignItemToSeries(
  seriesId: string,
  contentType: string,
  contentId: string,
  order?: number
) {
  // Validate content exists
  if (contentType === 'article') {
    const article = await prisma.article.findUnique({ where: { id: contentId } });
    if (!article) throw new Error('Article not found');
  } else if (contentType === 'chapter') {
    const chapter = await prisma.chapter.findUnique({ where: { id: contentId } });
    if (!chapter) throw new Error('Chapter not found');
  } else if (contentType === 'novel') {
    const novel = await prisma.novel.findUnique({ where: { id: contentId } });
    if (!novel) throw new Error('Novel not found');
  } else {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  // Determine next order if not specified
  if (order === undefined) {
    const lastItem = await prisma.seriesItem.findFirst({
      where: { seriesId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    order = (lastItem?.order ?? -1) + 1;
  }

  const item = await prisma.seriesItem.create({
    data: { seriesId, contentType, contentId, order },
  });
  return item;
}

// ─── Admin: Remove item from series ─────────────────────────────────────────

export async function removeItemFromSeries(seriesItemId: string) {
  await prisma.seriesItem.delete({ where: { id: seriesItemId } });
  return { success: true };
}
