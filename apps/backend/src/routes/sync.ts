import { Router } from 'express';
import {
  getSyncQueue,
  getLastSyncTime,
  syncActions,
} from '../controllers/sync.js';
import { authenticate } from '../middleware/auth.js';

export const syncRouter: Router = Router();

// All sync routes require authentication
syncRouter.use(authenticate);

// Sync routes
syncRouter.get('/queue', getSyncQueue);
syncRouter.get('/last-sync-time', getLastSyncTime);
syncRouter.post('/actions', syncActions);


