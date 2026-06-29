import { Router } from 'express';
import passport from 'passport';
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

// JWT auth helper
const authenticate = passport.authenticate('jwt', { session: false });

export const engagementRoutes = Router();

// Likes
engagementRoutes.post('/like', authenticate, toggleLike);
engagementRoutes.get('/like', getLikeStatus);

// Bookmarks
engagementRoutes.post('/bookmark', authenticate, toggleBookmark);
engagementRoutes.get('/bookmark', authenticate, getBookmarkStatus);
engagementRoutes.get('/bookmarks', authenticate, getUserBookmarks);

// Ratings
engagementRoutes.post('/rating', authenticate, setRating);
engagementRoutes.get('/rating', getRatingStatus);

// Comments
engagementRoutes.get('/comments', getComments);
engagementRoutes.post('/comment', authenticate, createComment);
engagementRoutes.put('/comment', authenticate, updateComment);
engagementRoutes.delete('/comment', authenticate, deleteComment);
engagementRoutes.put('/comment/moderate', authenticate, moderateComment);

// Reactions
engagementRoutes.post('/reaction', authenticate, setReaction);
engagementRoutes.get('/reaction', getReactionStatus);

// Polls
engagementRoutes.post('/poll', authenticate, createPoll);
engagementRoutes.get('/polls', getPolls);
engagementRoutes.post('/vote', authenticate, votePoll);
engagementRoutes.put('/vote', authenticate, changeVote);
engagementRoutes.delete('/poll', authenticate, deletePoll);
engagementRoutes.get('/results', getPollResults);

// Quotes
engagementRoutes.post('/quote', authenticate, saveQuote);
engagementRoutes.get('/quotes', authenticate, getQuotes);
engagementRoutes.delete('/quote', authenticate, deleteQuote);

// Follow
engagementRoutes.post('/follow', authenticate, toggleFollow);
engagementRoutes.get('/follow', getFollowStatus);
engagementRoutes.get('/followers', getFollowers);
engagementRoutes.get('/following', authenticate, getFollowing);

// Notifications
engagementRoutes.get('/notifications', authenticate, getNotifications);
engagementRoutes.post('/notification/read', authenticate, markNotificationRead);
engagementRoutes.post('/notifications/read-all', authenticate, markAllNotificationsRead);
engagementRoutes.get('/notification/settings', authenticate, getNotificationSettings);
engagementRoutes.put('/notification/settings', authenticate, updateNotificationSettings);

// Community Bookmarks
engagementRoutes.post('/community-bookmark', authenticate, toggleCommunityBookmark);
engagementRoutes.get('/community-bookmark', getCommunityBookmarkStatus);
engagementRoutes.get('/community-bookmarks', authenticate, getUserCommunityBookmarks);