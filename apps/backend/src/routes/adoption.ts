import { Router } from 'express';
import {
  getListings,
  createListing,
  getListing,
  updateListing,
  deleteListing,
  createApplication,
  getApplications,
} from '../controllers/adoption.js';
import { authenticate } from '../middleware/auth.js';

export const adoptionRouter: Router = Router();

// All adoption routes require authentication
adoptionRouter.use(authenticate);

// Adoption routes
adoptionRouter.get('/listings', getListings);
adoptionRouter.post('/listings', createListing);
adoptionRouter.get('/listings/:id', getListing);
adoptionRouter.put('/listings/:id', updateListing);
adoptionRouter.delete('/listings/:id', deleteListing);
adoptionRouter.post('/applications', createApplication);
adoptionRouter.get('/applications', getApplications);

