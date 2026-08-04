import { Request, Response } from 'express';
import * as discussionService from '../services/discussionService.js';

/**
 * Discussion controller — REST handlers for /api/discussion.
 * Follows existing controller conventions (see communityController.ts,
 * engagementController.ts): validate input, call service, return JSON.
 */

export async function createRoom(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { title, body, category } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const room = await discussionService.createRoom({ authorId: userId, title, body, category });
    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
}

export async function getRooms(req: Request, res: Response) {
  try {
    const { search, category, page, limit } = req.query;
    const result = await discussionService.getRooms({
      search: search as string | undefined,
      category: category as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
}

export async function getRoom(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const room = await discussionService.getRoom(id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await discussionService.getMessages(id, page, limit);
    res.json(result);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

export async function sendMessage(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const { content, parentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await discussionService.sendMessage({
      roomId: id,
      userId,
      content,
      parentId,
    });
    res.status(201).json(message);
  } catch (error: any) {
    if (error?.message === 'Not a member of this room') {
      return res.status(403).json({ error: error.message });
    }
    if (error?.message === 'You are muted in this room') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

export async function deleteMessage(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Authentication required' });

    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ error: 'Missing messageId' });

    const result = await discussionService.deleteMessage({
      messageId,
      userId: user.id,
      role: user.role,
    });
    res.json(result);
  } catch (error: any) {
    if (error?.message === 'Not authorized to delete this message') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
}

export async function pinMessage(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Authentication required' });

    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ error: 'Missing messageId' });

    const result = await discussionService.pinMessage({ messageId, userId: user.id, role: user.role });
    res.json(result);
  } catch (error: any) {
    if (error?.message === 'Not authorized to pin messages') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Pin message error:', error);
    res.status(500).json({ error: 'Failed to pin message' });
  }
}

export async function unpinMessage(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Authentication required' });

    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ error: 'Missing messageId' });

    const result = await discussionService.unpinMessage({ messageId, userId: user.id, role: user.role });
    res.json(result);
  } catch (error: any) {
    if (error?.message === 'Not authorized to unpin messages') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Unpin message error:', error);
    res.status(500).json({ error: 'Failed to unpin message' });
  }
}

export async function getPinnedMessages(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const messages = await discussionService.getPinnedMessages(id);
    res.json({ messages });
  } catch (error) {
    console.error('Get pinned messages error:', error);
    res.status(500).json({ error: 'Failed to fetch pinned messages' });
  }
}

export async function muteMember(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const { userId, mutedUntil } = req.body;
    if (!userId || !mutedUntil) {
      return res.status(400).json({ error: 'userId and mutedUntil are required' });
    }

    const result = await discussionService.setMemberMuted({
      roomId: id,
      userId,
      mutedUntil: new Date(mutedUntil),
      actorId: user.id,
      actorRole: user.role,
    });
    res.json(result);
  } catch (error: any) {
    if (error?.message === 'Not authorized to mute members') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Mute member error:', error);
    res.status(500).json({ error: 'Failed to mute member' });
  }
}

export async function unmuteMember(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.id) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const result = await discussionService.unmuteMember({
      roomId: id,
      userId,
      actorId: user.id,
      actorRole: user.role,
    });
    res.json(result);
  } catch (error: any) {
    if (error?.message === 'Not authorized to unmute members') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Unmute member error:', error);
    res.status(500).json({ error: 'Failed to unmute member' });
  }
}

export async function reportMessage(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const { commentId, reportedUserId, reason } = req.body;
    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: 'reportedUserId and reason are required' });
    }

    const result = await discussionService.reportMessage({
      roomId: id,
      commentId,
      reporterId: userId,
      reportedUserId,
      reason,
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Report message error:', error);
    res.status(500).json({ error: 'Failed to report message' });
  }
}

export async function markRoomRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const result = await discussionService.markRoomRead({ roomId: id, userId });
    res.json(result);
  } catch (error) {
    console.error('Mark room read error:', error);
    res.status(500).json({ error: 'Failed to mark room read' });
  }
}

export async function getUnreadCount(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;
    const count = await discussionService.getUnreadCount({ roomId: id, userId });
    res.json({ unread: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
}

export async function searchMessages(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { q } = req.query;
    if (!q || !String(q).trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const messages = await discussionService.searchMessages(id, String(q));
    res.json({ messages });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
}
