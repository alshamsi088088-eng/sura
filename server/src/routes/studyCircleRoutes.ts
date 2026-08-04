import { Router } from 'express';
import { authGuard } from '../middleware/authGuard.js';
import {
  createCircle,
  getCircles,
  getCircle,
  joinCircle,
  leaveCircle,
  getMembers,
  setModerator,
  getSchedule,
  updateSchedule,
  createGoal,
  updateGoalProgress,
  getGoals,
  createNote,
  updateNote,
  deleteNote,
  createAssignment,
  getAssignments,
  submitAssignment,
  scoreSubmission,
  getCalendar,
} from '../controllers/studyCircleController.js';

/**
 * Study circle routes — circles reuse CommunityThread (threadType =
 * "study_circle"). Auth via existing authGuard, matching project
 * conventions.
 */

export const studyCircleRoutes = Router();

// Public browsing
studyCircleRoutes.get('/circles', getCircles);
studyCircleRoutes.get('/circles/:id', getCircle);
studyCircleRoutes.get('/circles/:id/members', getMembers);
studyCircleRoutes.get('/circles/:id/schedule', getSchedule);
studyCircleRoutes.get('/circles/:id/goals', getGoals);
studyCircleRoutes.get('/circles/:id/assignments', getAssignments);
studyCircleRoutes.get('/circles/:id/calendar', getCalendar);

// Authenticated actions
studyCircleRoutes.post('/circles', authGuard, createCircle);
studyCircleRoutes.post('/circles/:id/join', authGuard, joinCircle);
studyCircleRoutes.post('/circles/:id/leave', authGuard, leaveCircle);
studyCircleRoutes.post('/circles/:id/moderator', authGuard, setModerator);
studyCircleRoutes.put('/circles/:id/schedule', authGuard, updateSchedule);
studyCircleRoutes.post('/circles/:id/goals', authGuard, createGoal);
studyCircleRoutes.put('/goals/:goalId', authGuard, updateGoalProgress);
studyCircleRoutes.post('/circles/:id/notes', authGuard, createNote);
studyCircleRoutes.put('/notes/:noteId', authGuard, updateNote);
studyCircleRoutes.delete('/notes/:noteId', authGuard, deleteNote);
studyCircleRoutes.post('/circles/:id/assignments', authGuard, createAssignment);
studyCircleRoutes.post('/assignments/:assignmentId/submit', authGuard, submitAssignment);
studyCircleRoutes.post('/submissions/:submissionId/score', authGuard, scoreSubmission);
