import { Router } from 'express';
import {
  getProducts,
  createIntent,
  confirmPayment,
  getSubscriptions,
  createSubscription,
  cancelSubscription,
  getEntitlements,
  updateEntitlements,
} from '../controllers/payments.js';
import { authenticate } from '../middleware/auth.js';

export const paymentsRouter: Router = Router();

// All payment routes require authentication
paymentsRouter.use(authenticate);

// Payment routes
paymentsRouter.get('/products', getProducts);
paymentsRouter.post('/create-intent', createIntent);
paymentsRouter.post('/confirm', confirmPayment);
paymentsRouter.get('/subscriptions', getSubscriptions);
paymentsRouter.post('/subscription', createSubscription);
paymentsRouter.delete('/subscriptions/:id', cancelSubscription);
paymentsRouter.get('/entitlements', getEntitlements);
paymentsRouter.put('/entitlements', updateEntitlements);

