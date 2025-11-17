/**
 * Backend Server
 *
 * Express server for PETSPARK backend API.
 * Integrated with PostgreSQL, JWT authentication, rate limiting, audit logging, and monitoring.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { authenticateJWT } from './middleware/jwt-auth';
import { requestIdMiddleware } from './middleware/request-id';
import {
  createGDPRRateLimiter,
  createDeletionRateLimiter,
  createExportRateLimiter,
  createConsentRateLimiter,
} from './middleware/rate-limit';
import { createGDPRRoutes } from './routes/gdpr-routes';
import { createAdminConfigRoutes } from './routes/admin-config-routes';
import { createAdminRoutes } from './routes/admin-routes';
import { GDPRService } from './services/gdpr-service';
import { PostgresDatabase, type PostgresConfig } from './services/postgres-database';
import { MockDatabase } from './services/mock-database';
import { AuditLogger } from './services/audit-logger';
import { AdminConfigService } from './services/admin-config-service';
import { ConfigHistoryService } from './services/config-history-service';
import { AdminAuditLogger } from './services/admin-audit-logger';
import { MonitoringService, createEmailAlertHandler, createSlackAlertHandler } from './services/monitoring';

const logger = createLogger('Server');

const app = express();
const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(requestIdMiddleware);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

// Initialize database
let db: PostgresDatabase | MockDatabase;
let pool: Pool | null = null;

if (process.env.DATABASE_URL || process.env.DB_HOST) {
  // Use PostgreSQL database
  const dbConfig: PostgresConfig = {
    host: process.env.DB_HOST ?? 'localhost',
    port: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : 5432,
    database: process.env.DB_NAME ?? 'petspark',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: process.env.DB_MAX_CONNECTIONS ? Number.parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 20,
  };

  // Create connection pool for audit logging and monitoring
  pool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: dbConfig.ssl,
    max: dbConfig.max,
  });

  db = new PostgresDatabase(dbConfig);
  logger.info('Using PostgreSQL database', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
  });
} else {
  // Use mock database for development
  db = new MockDatabase();
  logger.warn('Using mock database (set DATABASE_URL or DB_* env vars to use PostgreSQL)');
}

// Initialize services
const gdprService = new GDPRService(db);

// Initialize audit logger and monitoring (only if PostgreSQL is available)
let auditLogger: AuditLogger | null = null;
let monitoring: MonitoringService | null = null;
let adminConfigService: AdminConfigService | null = null;
let configHistoryService: ConfigHistoryService | null = null;
let adminAuditLogger: AdminAuditLogger | null = null;

if (pool) {
  auditLogger = new AuditLogger(pool);
  monitoring = new MonitoringService(pool);
  adminConfigService = new AdminConfigService(pool);
  configHistoryService = new ConfigHistoryService(pool);
  adminAuditLogger = new AdminAuditLogger(pool);
} else {
  logger.warn('Audit logging and monitoring disabled (PostgreSQL not configured)');
}

// Configure monitoring alerts (only if monitoring is available)
if (monitoring) {
  if (process.env.EMAIL_ALERTS_ENABLED === 'true') {
    const emailHandler = createEmailAlertHandler({
      from: process.env.EMAIL_FROM ?? 'alerts@petspark.com',
      to: (process.env.EMAIL_TO ?? '').split(',').filter(Boolean),
      smtpHost: process.env.SMTP_HOST ?? 'smtp.example.com',
      smtpPort: process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : 587,
      smtpUser: process.env.SMTP_USER ?? '',
      smtpPassword: process.env.SMTP_PASSWORD ?? '',
    });
    monitoring.onAlert(emailHandler);
  }

  if (process.env.SLACK_ALERTS_ENABLED === 'true' && process.env.SLACK_WEBHOOK_URL) {
    const slackHandler = createSlackAlertHandler({
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    });
    monitoring.onAlert(slackHandler);
  }
}

// Routes with rate limiting
// Note: Audit logging and monitoring are optional (only if PostgreSQL is configured)
if (!auditLogger || !monitoring) {
  logger.warn('GDPR routes will run without audit logging and monitoring');
}

// Create mock audit logger and monitoring if not available
const mockAuditLogger = auditLogger ?? ({
  logExport: async () => {},
  logDeletion: async () => {},
  logConsentRead: async () => {},
  logConsentUpdate: async () => {},
} as unknown as AuditLogger);

const mockMonitoring = monitoring ?? ({
  trackOperation: () => {},
} as unknown as MonitoringService);

const gdprRouter = createGDPRRoutes({
  gdprService,
  auditLogger: mockAuditLogger,
  monitoring: mockMonitoring,
});

// Apply rate limiting to GDPR routes
app.use(
  '/api/gdpr',
  authenticateJWT,
  createGDPRRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
  }),
  gdprRouter
);

// Apply specific rate limits to individual endpoints
app.post('/api/gdpr/export', createExportRateLimiter());
app.post('/api/gdpr/delete', createDeletionRateLimiter());
app.post('/api/gdpr/consent', createConsentRateLimiter());

// Admin routes (only if PostgreSQL is available)
if (pool && adminConfigService && configHistoryService && adminAuditLogger) {
  const adminConfigRouter = createAdminConfigRoutes({
    adminConfigService,
    configHistoryService,
    adminAuditLogger,
  });

  const adminRouter = createAdminRoutes({
    pool,
    adminAuditLogger,
  });

  // Admin config routes with authentication
  app.use('/api/v1', authenticateJWT, adminConfigRouter);

  // Admin routes (analytics, audit logs) with authentication
  app.use('/api/v1', authenticateJWT, adminRouter);

  logger.info('Admin routes registered');
} else {
  logger.warn('Admin routes disabled (PostgreSQL not configured)');
}

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    port: PORT,
    env: process.env.NODE_ENV ?? 'development',
    database: db instanceof PostgresDatabase ? 'PostgreSQL' : 'Mock',
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (db instanceof PostgresDatabase) {
    await db.close();
  }
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (db instanceof PostgresDatabase) {
    await db.close();
  }
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});
