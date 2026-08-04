import type { Request, Response } from 'express';
import * as adService from '../services/adService.js';
import { createUploadUrl } from '../services/uploadService.js';
import { writeAuditLog, listAuditLogs } from '../services/auditLogService.js';

function parsePagination(req: Request) {
  const page = Number(req.query.page ?? '1');
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export async function listAds(req: Request, res: Response) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const position = typeof req.query.position === 'string' ? req.query.position : undefined;
    const enabled = req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined;
    const page = parsePagination(req);

    const payload = await adService.listAds({ search, position, enabled }, page, 20);
    return res.json(payload);
  } catch (error) {
    console.error('listAds error:', error);
    res.status(500).json({ message: 'Failed to list ads' });
  }
}

export async function getAd(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const ad = await adService.getAdById(id);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });
    return res.json({ ad });
  } catch (error) {
    console.error('getAd error:', error);
    res.status(500).json({ message: 'Failed to fetch ad' });
  }
}

export async function createAd(req: Request, res: Response) {
  try {
    const user = req.user as { id?: string } | null | undefined;
    if (!user?.id) return res.status(401).json({ message: 'Unauthorized' });

    const {
      title,
      provider,
      providerData,
      position,
      priority,
      targeting,
      startAt,
      endAt,
      enabled,
      bannerUrl,
      clickUrl,
      altText
    } = req.body;

    if (!title || !provider || !position) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

const ad = await adService.createAd({
      title,
      provider,
      providerData,
      position,
      priority,
      targeting,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      enabled,
      bannerUrl,
      clickUrl,
      altText,
      createdBy: user.id
    });

    await writeAuditLog({
      actorId: user.id,
      action: 'ad.create',
      target: 'ad',
      targetId: ad.id,
      details: { title: ad.title, provider: ad.provider, position: ad.position },
    });

    return res.status(201).json({ ad });
  } catch (error) {
    console.error('createAd error:', error);
    res.status(500).json({ message: 'Failed to create ad' });
  }
}

export async function updateAd(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      title,
      provider,
      providerData,
      position,
      priority,
      targeting,
      startAt,
      endAt,
      enabled,
      bannerUrl,
      clickUrl,
      altText
    } = req.body;

const ad = await adService.updateAd(id, {
      title,
      provider,
      providerData,
      position,
      priority,
      targeting,
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      enabled,
      bannerUrl,
      clickUrl,
      altText
    });

    const user = req.user as { id?: string } | null | undefined;
    await writeAuditLog({
      actorId: user?.id,
      action: 'ad.update',
      target: 'ad',
      targetId: id,
      details: { title: ad.title, position: ad.position },
    });

    return res.json({ ad });
  } catch (error) {
    console.error('updateAd error:', error);
    res.status(500).json({ message: 'Failed to update ad' });
  }
}

export async function deleteAd(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user as { id?: string } | null | undefined;
    await adService.deleteAd(id);
    await writeAuditLog({
      actorId: user?.id,
      action: 'ad.delete',
      target: 'ad',
      targetId: id,
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('deleteAd error:', error);
    res.status(500).json({ message: 'Failed to delete ad' });
  }
}

export async function toggleAd(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled must be a boolean' });
    }
    const ad = await adService.setAdEnabled(id, enabled);
    const user = req.user as { id?: string } | null | undefined;
    await writeAuditLog({
      actorId: user?.id,
      action: enabled ? 'ad.enable' : 'ad.disable',
      target: 'ad',
      targetId: id,
    });
    return res.json({ ad });
  } catch (error) {
    console.error('toggleAd error:', error);
    res.status(500).json({ message: 'Failed to toggle ad status' });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;
    const target = typeof req.query.target === 'string' ? req.query.target : undefined;
    const actorId = typeof req.query.actorId === 'string' ? req.query.actorId : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page = parsePagination(req);

    const result = await listAuditLogs({ action, target, actorId, search }, page, 50);
    return res.json(result);
  } catch (error) {
    console.error('getAuditLogs error:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
}

export async function getUploadUrl(req: Request, res: Response) {
  try {
    const { bucket, path } = req.query;
    if (typeof bucket !== 'string' || typeof path !== 'string') {
      return res.status(400).json({ message: 'bucket and path are required' });
    }
    const url = await createUploadUrl(bucket, path, 300);
    return res.json({ uploadUrl: url });
  } catch (error) {
    console.error('getUploadUrl error:', error);
    res.status(500).json({ message: 'Failed to create upload URL' });
  }
}

export async function trackAdEvent(req: Request, res: Response) {
  try {
    const { adId, type, meta } = req.body;
    if (!adId || !type || (type !== 'impression' && type !== 'click')) {
      return res.status(400).json({ message: 'Invalid event payload' });
    }

    await adService.trackAdEvent({ adId, type, meta });
    return res.json({ success: true });
  } catch (error) {
    console.error('trackAdEvent error:', error);
    res.status(500).json({ message: 'Failed to track ad event' });
  }
}

export async function getAdMetrics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const metrics = await adService.getAdMetrics(id);
    return res.json({ metrics });
  } catch (error) {
    console.error('getAdMetrics error:', error);
    res.status(500).json({ message: 'Failed to fetch ad metrics' });
  }
}

export async function getSlotAds(req: Request, res: Response) {
  try {
    const position = req.params.position;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined;
    const ads = await adService.findAdsForSlot(position, category, locale);
    return res.json({ ads });
  } catch (error) {
    console.error('getSlotAds error:', error);
    res.status(500).json({ message: 'Failed to fetch ads' });
  }
}
