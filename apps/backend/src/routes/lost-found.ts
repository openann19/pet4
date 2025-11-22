import { Router } from 'express';
import {
  createLostAlert,
  getLostAlerts,
  getLostAlert,
  updateAlertStatus,
  incrementView,
  createSighting,
  getSightings,
} from '../controllers/lost-found.js';
import { authenticate } from '../middleware/auth.js';

export const lostFoundRouter: Router = Router();

// All lost & found routes require authentication
lostFoundRouter.use(authenticate);

// Lost & Found routes
lostFoundRouter.post('/lost', createLostAlert);
lostFoundRouter.get('/lost', getLostAlerts);
lostFoundRouter.get('/lost/:id', getLostAlert);
lostFoundRouter.put('/lost/:id/status', updateAlertStatus);
lostFoundRouter.put('/lost/:id/increment-view', incrementView);
lostFoundRouter.post('/sightings', createSighting);
lostFoundRouter.get('/sightings', getSightings);

