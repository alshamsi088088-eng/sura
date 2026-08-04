import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import {
  createRoom,
  getRooms,
  getRoom,
  getMessages,
  sendMessage,
  deleteMessage,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  muteMember,
  unmuteMember,
  reportMessage,
  markRoomRead,
  getUnreadCount,
  searchMessages,
} from '../controllers/discussionController.js';

/**
 * Discussion routes — live discussion rooms.
 *
 * Rooms reuse CommunityThread (threadType = "room"); chat messages reuse
 * Comment (communityId). Auth via existing authGuard (cookie JWT or Supabase
 * bearer token), matching engagementRoutes conventions.
 */

export const discussionRoutes = Router();

// Public room browsing
discussionRoutes.get('/rooms', getRooms);
discussionRoutes.get('/rooms/:id', getRoom);
discussionRoutes.get('/rooms/:id/messages', getMessages);
discussionRoutes.get('/rooms/:id/pinned', getPinnedMessages);
discussionRoutes.get('/rooms/:id/search', searchMessages);

// Authenticated actions
discussionRoutes.post('/rooms', authGuard, createRoom);
discussionRoutes.post('/rooms/:id/messages', authGuard, sendMessage);
discussionRoutes.delete('/messages', authGuard, deleteMessage);
discussionRoutes.post('/messages/pin', authGuard, pinMessage);
discussionRoutes.post('/messages/unpin', authGuard, unpinMessage);
discussionRoutes.post('/rooms/:id/mute', authGuard, muteMember);
discussionRoutes.post('/rooms/:id/unmute', authGuard, unmuteMember);
discussionRoutes.post('/rooms/:id/report', authGuard, reportMessage);
discussionRoutes.post('/rooms/:id/read', authGuard, markRoomRead);
discussionRoutes.get('/rooms/:id/unread', authGuard, getUnreadCount);
