import { Router } from 'express';
import {
  getStatus,
  startKyc,
  submitDocuments,
  getVerification,
} from '../controllers/kyc.js';
import { authenticate } from '../middleware/auth.js';

export const kycRouter: Router = Router();

// All KYC routes require authentication
kycRouter.use(authenticate);

// KYC routes
kycRouter.get('/status', getStatus);
kycRouter.post('/start', startKyc);
kycRouter.post('/documents', submitDocuments);
kycRouter.get('/verifications/:id', getVerification);

