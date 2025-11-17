import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, refresh, logout, getMe } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';

export const authRouter = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
authRouter.post('/login', authLimiter, login);
authRouter.post('/register', authLimiter, register);
authRouter.post('/refresh', refresh);

// Protected routes
authRouter.post('/logout', authenticate, logout);
authRouter.get('/me', authenticate, getMe);

// TODO: Implement these endpoints
// authRouter.post('/forgot-password', authLimiter, forgotPassword);
// authRouter.post('/reset-password', authLimiter, resetPassword);
// authRouter.post('/verify-email', verifyEmail);

