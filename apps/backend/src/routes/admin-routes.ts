/**
 * Admin Routes
 *
 * Express routes for admin dashboard: analytics, audit logs, and system management.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { Pool } from 'pg';
import { AdminAuditLogger } from '../services/admin-audit-logger';
import { validate } from '../middleware/validate';
import { createLogger } from '../utils/logger';

const logger = createLogger('AdminRoutes');

export interface AdminRoutesConfig {
  pool: Pool;
  adminAuditLogger: AdminAuditLogger;
}

// Validation schemas
const auditLogCreateSchema = z.object({
  adminId: z.string().min(1, 'Admin ID is required'),
  action: z.string().min(1, 'Action is required'),
  targetType: z.string().min(1, 'Target type is required'),
  targetId: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

const auditLogsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  adminId: z.string().min(1).optional(),
  action: z.string().min(1).optional(),
  targetType: z.string().min(1).optional(),
});

export function createAdminRoutes(config: AdminRoutesConfig): Router {
  const { pool, adminAuditLogger } = config;
  const router = Router();

  /**
   * GET /api/v1/admin/analytics
   * Get system statistics for admin dashboard
   */
  router.get('/admin/analytics', async (req: Request, res: Response): Promise<void> => {
    const client = await pool.connect();
    try {
      // Get user statistics
      const usersResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM users`
      );
      const totalUsers = Number.parseInt(usersResult.rows[0]?.count ?? '0', 10);

      // Get active users (last 30 days)
      const activeUsersResult = await client.query<{ count: string }>(
        `SELECT COUNT(DISTINCT "userId") as count
        FROM sessions
        WHERE "lastActivityAt" > NOW() - INTERVAL '30 days'`
      );
      const activeUsers = Number.parseInt(activeUsersResult.rows[0]?.count ?? '0', 10);

      // Get pet statistics
      const petsResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM pets`
      );
      const totalPets = Number.parseInt(petsResult.rows[0]?.count ?? '0', 10);

      // Get match statistics
      const matchesResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM matches`
      );
      const totalMatches = Number.parseInt(matchesResult.rows[0]?.count ?? '0', 10);

      // Get message statistics
      const messagesResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM messages`
      );
      const totalMessages = Number.parseInt(messagesResult.rows[0]?.count ?? '0', 10);

      // Get pending reports (assuming reports table exists)
      // If not, return 0
      let pendingReports = 0;
      try {
        const reportsResult = await client.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`
        );
        pendingReports = Number.parseInt(reportsResult.rows[0]?.count ?? '0', 10);
      } catch {
        // Reports table may not exist, return 0
        logger.debug('Reports table not found, returning 0 for pending reports');
      }

      // Get pending verifications
      let pendingVerifications = 0;
      try {
        const verificationsResult = await client.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM verifications WHERE status = 'pending'`
        );
        pendingVerifications = Number.parseInt(
          verificationsResult.rows[0]?.count ?? '0',
          10
        );
      } catch {
        // Verifications table may not exist, return 0
        logger.debug('Verifications table not found, returning 0 for pending verifications');
      }

      // Get resolved reports
      let resolvedReports = 0;
      try {
        const resolvedResult = await client.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM reports WHERE status = 'resolved'`
        );
        resolvedReports = Number.parseInt(resolvedResult.rows[0]?.count ?? '0', 10);
      } catch {
        // Reports table may not exist, return 0
        logger.debug('Reports table not found, returning 0 for resolved reports');
      }

      const stats = {
        totalUsers,
        activeUsers,
        totalPets,
        totalMatches,
        totalMessages,
        pendingReports,
        pendingVerifications,
        resolvedReports,
      };

      logger.info('System stats retrieved', stats);

      res.status(200).json(stats);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get system stats', err);

      // Return default stats on error
      res.status(200).json({
        totalUsers: 0,
        activeUsers: 0,
        totalPets: 0,
        totalMatches: 0,
        totalMessages: 0,
        pendingReports: 0,
        pendingVerifications: 0,
        resolvedReports: 0,
      });
    } finally {
      client.release();
    }
  });

  /**
   * GET /api/v1/admin/settings/audit
   * Get admin audit logs (legacy endpoint)
   */
  router.get(
    '/admin/settings/audit',
    validate({ query: auditLogsQuerySchema }),
    async (req: Request, res: Response): Promise<void> => {
      try {
        type ValidatedQuery = z.infer<typeof auditLogsQuerySchema>;
        const query = req.query as unknown as ValidatedQuery;
        const limit = query.limit ?? 100;
        const offset = query.offset ?? 0;
        const adminId = query.adminId;
        const action = query.action;
        const targetType = query.targetType;

      const result = await adminAuditLogger.getAuditLogs({
        limit,
        offset,
        adminId,
        action,
        targetType,
      });

      res.status(200).json(
        result.logs.map((log) => ({
          id: log.id,
          adminId: log.adminId,
          adminName: log.adminName,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          details: log.details,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          timestamp: log.timestamp.toISOString(),
        }))
      );
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to get admin audit logs', err);
        throw error;
      }
    }
  );

  /**
   * GET /api/v1/admin/audit-logs
   * Get admin audit logs (new endpoint for mobile/web compatibility)
   */
  router.get(
    '/admin/audit-logs',
    validate({ query: auditLogsQuerySchema }),
    async (req: Request, res: Response): Promise<void> => {
      try {
        type ValidatedQuery = z.infer<typeof auditLogsQuerySchema>;
        const query = req.query as unknown as ValidatedQuery;
        const limit = query.limit ?? 100;
        const offset = query.offset ?? 0;
        const adminId = query.adminId;
        const action = query.action;
        const targetType = query.targetType;

      const result = await adminAuditLogger.getAuditLogs({
        limit,
        offset,
        adminId,
        action,
        targetType,
      });

      res.status(200).json(
        result.logs.map((log) => ({
          id: log.id,
          adminId: log.adminId,
          adminName: log.adminName,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          details: log.details,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          timestamp: log.timestamp.toISOString(),
        }))
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get admin audit logs', err);
      throw error;
    }
    }
  );

  /**
   * POST /api/v1/admin/settings/audit
   * Create admin audit log entry (legacy endpoint)
   */
  router.post(
    '/admin/settings/audit',
    validate({ body: auditLogCreateSchema }),
    async (req: Request, res: Response): Promise<void> => {
      type ValidatedBody = z.infer<typeof auditLogCreateSchema>;
      const validatedBody = req.body as unknown as ValidatedBody;
      const userId = req.userId ?? validatedBody.adminId ?? 'admin';

      try {
        await adminAuditLogger.log({
          adminId: validatedBody.adminId,
          adminName: (req.user as { name?: string })?.name,
          action: validatedBody.action,
          targetType: validatedBody.targetType,
          targetId: validatedBody.targetId,
          details: validatedBody.details,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        logger.info('Admin audit log created', {
          adminId: validatedBody.adminId,
          action: validatedBody.action,
        });

      res.status(201).json({ success: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create admin audit log', err, { userId });
      throw error;
    }
  });

  /**
   * POST /api/v1/admin/audit-logs
   * Create admin audit log entry (new endpoint for mobile/web compatibility)
   */
  router.post(
    '/admin/audit-logs',
    (req: Request, _res: Response, next: NextFunction): void => {
      // Preprocess details field: handle both string (from mobile) and object (from web)
      if (req.body.details) {
        if (typeof req.body.details === 'string') {
          try {
            req.body.details = JSON.parse(req.body.details);
          } catch {
            req.body.details = { message: req.body.details };
          }
        }
      }
      next();
    },
    validate({ body: auditLogCreateSchema }),
    async (req: Request, res: Response): Promise<void> => {
      type ValidatedBody = z.infer<typeof auditLogCreateSchema>;
      const validatedBody = req.body as unknown as ValidatedBody;
      const userId = req.userId ?? validatedBody.adminId ?? 'admin';

      try {
        await adminAuditLogger.log({
          adminId: validatedBody.adminId,
          adminName: (req.user as { name?: string })?.name,
          action: validatedBody.action,
          targetType: validatedBody.targetType,
          targetId: validatedBody.targetId,
          details: validatedBody.details,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });

        logger.info('Admin audit log created', {
          adminId: validatedBody.adminId,
          action: validatedBody.action,
        });

      res.status(201).json({ success: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create admin audit log', err, { userId });
      throw error;
    }
    }
  );

  return router;
}
