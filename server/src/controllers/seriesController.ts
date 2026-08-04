import type { Request, Response } from 'express';
import * as seriesService from '../services/seriesService.js';

// ─── Public Routes ──────────────────────────────────────────────────────────

export async function getAllSeries(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const series = await seriesService.getAllSeries(userId);
    return res.json({ series });
  } catch (error) {
    console.error('getAllSeries error:', error);
    return res.status(500).json({ message: 'Failed to fetch series' });
  }
}

export async function getSeriesBySlug(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const { slug } = req.params;
    const series = await seriesService.getSeriesBySlug(slug, userId);
    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }
    return res.json({ series });
  } catch (error) {
    console.error('getSeriesBySlug error:', error);
    return res.status(500).json({ message: 'Failed to fetch series' });
  }
}

export async function getSeriesProgress(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { slug } = req.params;
    const series = await seriesService.getSeriesBySlug(slug);
    if (!series) {
      return res.status(404).json({ message: 'Series not found' });
    }

    const progress = await seriesService.getSeriesProgress(series.id, userId);
    return res.json(progress);
  } catch (error) {
    console.error('getSeriesProgress error:', error);
    return res.status(500).json({ message: 'Failed to fetch series progress' });
  }
}

export async function getRecommendedSeries(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 4;
    const series = await seriesService.getRecommendedSeries(userId, category, limit);
    return res.json({ series });
  } catch (error) {
    console.error('getRecommendedSeries error:', error);
    return res.status(500).json({ message: 'Failed to fetch recommended series' });
  }
}

// ─── Admin Routes ───────────────────────────────────────────────────────────

export async function adminCreateSeries(req: Request, res: Response) {
  try {
    const { title, slug, description, coverImage, estimatedReadingTime, difficulty, category, authorName } = req.body;
    if (!title || !slug || !description || !estimatedReadingTime || !difficulty || !category || !authorName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const authorId = (req as any).user?.id;
    const series = await seriesService.createSeries({
      title,
      slug,
      description,
      coverImage,
      estimatedReadingTime,
      difficulty,
      category,
      authorName,
      authorId,
    });
    return res.status(201).json({ series });
  } catch (error) {
    console.error('adminCreateSeries error:', error);
    return res.status(500).json({ message: 'Failed to create series' });
  }
}

export async function adminUpdateSeries(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, slug, description, coverImage, estimatedReadingTime, difficulty, category, authorName } = req.body;

    const series = await seriesService.updateSeries(id, {
      title,
      slug,
      description,
      coverImage,
      estimatedReadingTime,
      difficulty,
      category,
      authorName,
    });
    return res.json({ series });
  } catch (error) {
    console.error('adminUpdateSeries error:', error);
    return res.status(500).json({ message: 'Failed to update series' });
  }
}

export async function adminDeleteSeries(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await seriesService.deleteSeries(id);
    return res.json({ success: true, message: 'Series deleted' });
  } catch (error) {
    console.error('adminDeleteSeries error:', error);
    return res.status(500).json({ message: 'Failed to delete series' });
  }
}

export async function adminReorderSeriesItems(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ message: 'orderedIds must be an array' });
    }
    await seriesService.reorderSeriesItems(id, orderedIds);
    return res.json({ success: true, message: 'Items reordered' });
  } catch (error) {
    console.error('adminReorderSeriesItems error:', error);
    return res.status(500).json({ message: 'Failed to reorder items' });
  }
}

export async function adminAssignItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { contentType, contentId, order } = req.body;
    if (!contentType || !contentId) {
      return res.status(400).json({ message: 'contentType and contentId are required' });
    }
    const item = await seriesService.assignItemToSeries(id, contentType, contentId, order);
    return res.status(201).json({ item });
  } catch (error) {
    console.error('adminAssignItem error:', error);
    return res.status(500).json({ message: 'Failed to assign item' });
  }
}

export async function adminRemoveItem(req: Request, res: Response) {
  try {
    const { itemId } = req.params;
    await seriesService.removeItemFromSeries(itemId);
    return res.json({ success: true, message: 'Item removed from series' });
  } catch (error) {
    console.error('adminRemoveItem error:', error);
    return res.status(500).json({ message: 'Failed to remove item' });
  }
}
