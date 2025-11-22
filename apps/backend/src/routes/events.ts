import { Router } from 'express';
import { createEvent } from '../controllers/events.js';
import { authenticate } from '../middleware/auth.js';

export const eventsRouter: Router = Router();

// All event routes require authentication
eventsRouter.use(authenticate);

// Event routes
eventsRouter.post('/', createEvent);


