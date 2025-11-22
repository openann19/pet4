import { Router } from 'express';
import {
  getPolicy,
  getTasks,
  getTask,
  takeTask,
} from '../controllers/moderation-tasks.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

export const moderationTasksRouter: Router = Router();

// All moderation routes require authentication and admin role
moderationTasksRouter.use(authenticate);
moderationTasksRouter.use(requireAdmin);

// Moderation routes
moderationTasksRouter.get('/policy', getPolicy);
moderationTasksRouter.get('/tasks', getTasks);
moderationTasksRouter.get('/tasks/:id', getTask);
moderationTasksRouter.post('/tasks/:id/take', takeTask);

