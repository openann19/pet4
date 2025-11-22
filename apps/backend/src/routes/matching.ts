import { Router } from 'express';
import {
  getPreferences,
  updatePreferences,
  discover,
  swipe,
  getMatches,
  score,
} from '../controllers/matching.js';
import { authenticate } from '../middleware/auth.js';

export const matchingRouter = Router();

// All matching routes require authentication
matchingRouter.use(authenticate);

// Matching routes
matchingRouter.get('/preferences', getPreferences);
matchingRouter.put('/preferences', updatePreferences);
matchingRouter.post('/discover', discover);
matchingRouter.post('/swipe', swipe);
matchingRouter.get('/matches', getMatches);
matchingRouter.post('/score', score);

