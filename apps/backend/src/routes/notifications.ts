import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  getSettings,
  updateSettings,
} from '../controllers/notifications.js';
import { authenticate } from '../middleware/auth.js';

export const notificationsRouter = Router();

// All notification routes require authentication
notificationsRouter.use(authenticate);

// Notification routes
notificationsRouter.get('/', getNotifications);
notificationsRouter.put('/:id/read', markNotificationRead);
notificationsRouter.put('/read-all', markAllRead);
notificationsRouter.get('/settings', getSettings);
notificationsRouter.put('/settings', updateSettings);

