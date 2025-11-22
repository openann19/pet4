import { Router } from 'express';
import {
  getPhotos,
  getPhoto,
  createPhoto,
  checkDuplicate,
  releaseHeld,
} from '../controllers/photos.js';
import { authenticate } from '../middleware/auth.js';

export const photosRouter: Router = Router();

// All photo routes require authentication
photosRouter.use(authenticate);

// Photo routes
photosRouter.get('/', getPhotos);
photosRouter.get('/:id', getPhoto);
photosRouter.post('/', createPhoto);
photosRouter.post('/check-duplicate', checkDuplicate);
photosRouter.post('/release-held', releaseHeld);

