/**
 * Admin Routes
 *
 * Express routes for admin dashboard: analytics, audit logs, and system management.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { AdminAuditLogger } from '../services/admin-audit-logger';
import { ValidationError } from '../utils/errors';
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
  router.get('/admin/settings/audit', async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit
        ? Number.parseInt(String(req.query.limit), 10)
        : 100;
      const offset = req.query.offset
        ? Number.parseInt(String(req.query.offset), 10)
        : 0;
      const adminId = req.query.adminId ? String(req.query.adminId) : undefined;
      const action = req.query.action ? String(req.query.action) : undefined;
      const targetType = req.query.targetType
        ? String(req.query.targetType)
        : undefined;

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
  });

  /**
   * GET /api/v1/admin/audit-logs
   * Get admin audit logs (new endpoint for mobile/web compatibility)
   */
  router.get('/admin/audit-logs', async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit
        ? Number.parseInt(String(req.query.limit), 10)
        : 100;
      const offset = req.query.offset
        ? Number.parseInt(String(req.query.offset), 10)
        : 0;
      const adminId = req.query.adminId ? String(req.query.adminId) : undefined;
      const action = req.query.action ? String(req.query.action) : undefined;
      const targetType = req.query.targetType
        ? String(req.query.targetType)
        : undefined;

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
  });

  /**
   * POST /api/v1/admin/settings/audit
   * Create admin audit log entry (legacy endpoint)
   */
  router.post('/admin/settings/audit', async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId ?? req.body.adminId ?? 'admin';

    try {
      const validationResult = auditLogCreateSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request data', {
          errors: validationResult.error.errors,
        });
      }

      await adminAuditLogger.log({
        adminId: validationResult.data.adminId,
        adminName: (req.user as { name?: string })?.name,
        action: validationResult.data.action,
        targetType: validationResult.data.targetType,
        targetId: validationResult.data.targetId,
        details: validationResult.data.details,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      logger.info('Admin audit log created', {
        adminId: validationResult.data.adminId,
        action: validationResult.data.action,
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
  router.post('/admin/audit-logs', async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId ?? req.body.adminId ?? 'admin';

    try {
      // Handle both string details (from mobile) and object details (from web)
      const body = req.body;
      let details: Record<string, unknown> | undefined;

      if (body.details) {
        if (typeof body.details === 'string') {
          try {
            details = JSON.parse(body.details);
          } catch {
            details = { message: body.details };
          }
        } else {
          details = body.details;
        }
      }

      const validationResult = auditLogCreateSchema.safeParse({
        ...body,
        details,
      });

      if (!validationResult.success) {
        throw new ValidationError('Invalid request data', {
          errors: validationResult.error.errors,
        });
      }

      await adminAuditLogger.log({
        adminId: validationResult.data.adminId,
        adminName: (req.user as { name?: string })?.name,
        action: validationResult.data.action,
        targetType: validationResult.data.targetType,
        targetId: validationResult.data.targetId,
        details: validationResult.data.details,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      logger.info('Admin audit log created', {
        adminId: validationResult.data.adminId,
        action: validationResult.data.action,
      });

      res.status(201).json({ success: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create admin audit log', err, { userId });
      throw error;
    }
  });

  return router;
}
