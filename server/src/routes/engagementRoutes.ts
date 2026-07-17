import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import {
  toggleLike,
  getLikeStatus,
  toggleBookmark,
  getBookmarkStatus,
  getUserBookmarks,
  setRating,
  getRatingStatus,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  moderateComment,
  setReaction,
  getReactionStatus,
  createPoll,
  getPolls,
  votePoll,
  changeVote,
  deletePoll,
  getPollResults,
  saveQuote,
  getQuotes,
  deleteQuote,
  toggleFollow,
  getFollowStatus,
  getFollowers,
  getFollowing,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationSettings,
  updateNotificationSettings,
  toggleCommunityBookmark,
  getCommunityBookmarkStatus,
  getUserCommunityBookmarks
} from '../controllers/engagementController.js';

// NOTE: previously this used passport.authenticate('jwt', ...), but no JWT
// strategy was ever registered with passport.use(...) anywhere in the app
// (only a Google OAuth strategy is registered in passportConfig.ts). That
// caused passport to throw internally on every request through this
// middleware, which the global error handler turned into an opaque
// 500 "Internal server error" instead of a normal 401. authGuard is the
// middleware already used successfully elsewhere in the app (e.g. the
// reading-progress routes) — it checks the cookie-based JWT and falls back
// to validating a Supabase access token, so it works correctly here too.
export const engagementRoutes = Router();

// Likes
engagementRoutes.post('/like', authGuard, toggleLike);
engagementRoutes.get('/like', getLikeStatus);

// Bookmarks
engagementRoutes.post('/bookmark', authGuard, toggleBookmark);
engagementRoutes.get('/bookmark', authGuard, getBookmarkStatus);
engagementRoutes.get('/bookmarks', authGuard, getUserBookmarks);

// Ratings
engagementRoutes.post('/rating', authGuard, setRating);
engagementRoutes.get('/rating', getRatingStatus);

// Comments
engagementRoutes.get('/comments', getComments);
engagementRoutes.post('/comment', authGuard, createComment);
engagementRoutes.put('/comment', authGuard, updateComment);
engagementRoutes.delete('/comment', authGuard, deleteComment);
engagementRoutes.put('/comment/moderate', authGuard, moderateComment);

// Reactions
engagementRoutes.post('/reaction', authGuard, setReaction);
engagementRoutes.get('/reaction', getReactionStatus);

// Polls
engagementRoutes.post('/poll', authGuard, createPoll);
engagementRoutes.get('/polls', getPolls);
engagementRoutes.post('/vote', authGuard, votePoll);
engagementRoutes.put('/vote', authGuard, changeVote);
engagementRoutes.delete('/poll', authGuard, deletePoll);
engagementRoutes.get('/results', getPollResults);

// Quotes
engagementRoutes.post('/quote', authGuard, saveQuote);
engagementRoutes.get('/quotes', authGuard, getQuotes);
engagementRoutes.delete('/quote', authGuard, deleteQuote);

// Follow
engagementRoutes.post('/follow', authGuard, toggleFollow);
engagementRoutes.get('/follow', getFollowStatus);
engagementRoutes.get('/followers', getFollowers);
engagementRoutes.get('/following', authGuard, getFollowing);

// Notifications
engagementRoutes.get('/notifications', authGuard, getNotifications);
engagementRoutes.post('/notification/read', authGuard, markNotificationRead);
engagementRoutes.post('/notifications/read-all', authGuard, markAllNotificationsRead);
engagementRoutes.get('/notification/settings', authGuard, getNotificationSettings);
engagementRoutes.put('/notification/settings', authGuard, updateNotificationSettings);

// Community Bookmarks
engagementRoutes.post('/community-bookmark', authGuard, toggleCommunityBookmark);
engagementRoutes.get('/community-bookmark', getCommunityBookmarkStatus);
engagementRoutes.get('/community-bookmarks', authGuard, getUserCommunityBookmarks);