import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getPreferences,
  updatePreferences,
  getNotifications,
  getSettings,
  updateLocation,
  getNearbyUsers,
} from '../controllers/users.js';
import { getQuota, incrementQuota } from '../controllers/quotas.js';
import { authenticate } from '../middleware/auth.js';

export const usersRouter: Router = Router();

// All user routes require authentication
usersRouter.use(authenticate);

// Profile routes
usersRouter.get('/profile', getProfile);
usersRouter.put('/profile', updateProfile);
usersRouter.post('/avatar', uploadAvatar);

// Preferences routes
usersRouter.get('/preferences', getPreferences);
usersRouter.put('/preferences', updatePreferences);

// Notifications route
usersRouter.get('/notifications', getNotifications);

// Settings route
usersRouter.get('/settings', getSettings);

// Location routes
usersRouter.put('/location', updateLocation);
usersRouter.get('/location/nearby', getNearbyUsers);

// Quota routes
usersRouter.get('/:userId/quota', getQuota);
usersRouter.post('/:userId/quota/increment', incrementQuota);

