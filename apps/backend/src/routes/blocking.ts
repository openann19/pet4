import { Router } from 'express';
import {
  blockPet,
  blockUser,
  unblockPet,
  getBlockStatus,
  getBlockedPets,
} from '../controllers/blocking.js';
import { authenticate } from '../middleware/auth.js';

export const blockingRouter: Router = Router();

// All blocking routes require authentication
blockingRouter.use(authenticate);

// Blocking routes
blockingRouter.post('/block', blockPet);
blockingRouter.post('/block-user', blockUser);
blockingRouter.delete('/unblock/:blockerPetId/:blockedPetId', unblockPet);
blockingRouter.get('/status/:blockerPetId/:blockedPetId', getBlockStatus);
blockingRouter.get('/pets/:petId/blocked', getBlockedPets);

