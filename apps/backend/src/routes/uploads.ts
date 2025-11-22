import { Router } from 'express';
import { signUrl, completeUpload, deleteUpload } from '../controllers/uploads.js';
import { authenticate } from '../middleware/auth.js';

export const uploadsRouter = Router();

// All upload routes require authentication
uploadsRouter.use(authenticate);

// Upload routes
uploadsRouter.post('/sign-url', signUrl);
uploadsRouter.post('/complete', completeUpload);
uploadsRouter.delete('/:key', deleteUpload);

