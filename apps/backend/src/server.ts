import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { healthRouter } from './routes/health.js';
import { apiRouter } from './routes/api.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// ===================================
// Middleware
// ===================================

// Security
app.use(helmet());

// CORS
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// Cookie parsing
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// ===================================
// Routes
// ===================================

// Health check endpoints (no version prefix)
app.use('/healthz', healthRouter);
app.use('/readyz', healthRouter);
app.use('/api/version', healthRouter);

// API routes
app.use(`/api/${API_VERSION}`, apiRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PetSpark API Server',
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    apiVersion: API_VERSION,
    endpoints: {
      health: '/healthz',
      readiness: '/readyz',
      version: '/api/version',
      api: `/api/${API_VERSION}`,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ===================================
// Start Server
// ===================================

app.listen(PORT, () => {
  logger.info(`🚀 PetSpark API Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API Version: ${API_VERSION}`);
  logger.info(`Health: http://localhost:${PORT}/healthz`);
  logger.info(`API: http://localhost:${PORT}/api/${API_VERSION}`);
});

export default app;

