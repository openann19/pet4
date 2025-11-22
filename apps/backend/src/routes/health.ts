import { Router } from 'express';
import { healthCheck, readinessCheck, versionInfo } from '../controllers/health.js';

export const healthRouter = Router();

// Health check (liveness probe)
healthRouter.get('/healthz', healthCheck);

// Readiness check
healthRouter.get('/readyz', readinessCheck);

// Version info
healthRouter.get('/api/version', versionInfo);

