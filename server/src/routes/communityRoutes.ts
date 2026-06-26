import { Router } from 'express';
import passport from 'passport';
import {
  createThread,
  getThreads,
  getThread,
  deleteThread,
  getCategories,
} from '../controllers/communityController.js';

const router = Router();

router.get('/categories', getCategories);
router.get('/threads', getThreads);
router.get('/threads/:id', getThread);

router.post(
  '/threads',
  passport.authenticate('jwt', { session: false }),
  createThread
);

router.delete(
  '/threads/:id',
  passport.authenticate('jwt', { session: false }),
  deleteThread
);

export const communityRoutes = router;