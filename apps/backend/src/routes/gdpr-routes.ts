/**
 * GDPR Routes
 *
 * Express routes for GDPR endpoints: export, deletion, and consent management.
 * Integrated with audit logging and monitoring.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import type {
  DataDeletionRequest,
  ConsentUpdateRequest,
} from '../../../../packages/shared/src/gdpr/gdpr-types';
import { GDPRService } from '../services/gdpr-service';
import { AuditLogger } from '../services/audit-logger';
import { MonitoringService } from '../services/monitoring';
import { ValidationError } from '../utils/errors';
import { createLogger } from '../utils/logger';
import { validate } from '../middleware/validate';

const logger = createLogger('GDPRRoutes');

// Validation schemas
const dataExportRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  format: z.enum(['json']).optional().default('json'),
});

const dataDeletionRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  confirmDeletion: z.boolean().refine((val) => val === true, {
    message: 'Deletion must be confirmed',
  }),
  reason: z.string().optional(),
});

const consentUpdateRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  category: z.enum(['essential', 'analytics', 'marketing', 'third_party']),
  status: z.enum(['accepted', 'rejected', 'withdrawn']),
  version: z.string().min(1, 'Version is required'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

const consentQuerySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export interface GDPRRoutesConfig {
  gdprService: GDPRService;
  auditLogger: AuditLogger;
  monitoring: MonitoringService;
}

export function createGDPRRoutes(config: GDPRRoutesConfig): Router {
  const { gdprService, auditLogger, monitoring } = config;
  const router = Router();

  /**
   * POST /api/gdpr/export
   * Export user data (GDPR Right to Access)
   */
  router.post(
    '/export',
    validate({ body: dataExportRequestSchema }),
    async (req: Request, res: Response): Promise<void> => {
      const startTime = Date.now();
      type ValidatedBody = z.infer<typeof dataExportRequestSchema>;
      const request = req.body as unknown as ValidatedBody;
      const userId = req.userId ?? request.userId;

      try {
        const exportData = await gdprService.exportUserData(request);
      const duration = Date.now() - startTime;

      // Audit log
      await auditLogger.logExport(userId, 'success', {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        recordCount: Object.values(exportData).reduce((sum, arr) => {
          return sum + (Array.isArray(arr) ? arr.length : 0);
        }, 0),
      });

      // Monitor
      monitoring.trackOperation('export', duration, true);

      res.status(200).json(exportData);
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      // Audit log
      await auditLogger.logExport(userId, 'failure', {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        error: err.message,
      });

      // Monitor
      monitoring.trackOperation('export', duration, false);

      logger.error('Export request failed', err, {
        path: req.path,
        method: req.method,
        body: req.body,
        userId,
      });
      throw error;
    }
  });

  /**
   * POST /api/gdpr/delete
   * Delete user data (GDPR Right to Erasure)
   */
  router.post(
    '/delete',
    validate({ body: dataDeletionRequestSchema }),
    async (req: Request, res: Response): Promise<void> => {
      const startTime = Date.now();
      type ValidatedBody = z.infer<typeof dataDeletionRequestSchema>;
      const validatedBody = req.body as unknown as ValidatedBody;
      const userId = req.userId ?? validatedBody.userId;

      try {
        const request: DataDeletionRequest = {
          userId: validatedBody.userId,
          confirmDeletion: validatedBody.confirmDeletion,
          ...(validatedBody.reason !== undefined && {
            reason: validatedBody.reason,
          }),
        };
      const result = await gdprService.deleteUserData(request);
      const duration = Date.now() - startTime;

      // Audit log
      await auditLogger.logDeletion(userId, 'success', {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        collections: result.deletedCollections,
        recordCount: result.deletedRecords,
      });

      // Monitor
      monitoring.trackOperation('delete', duration, true);

      res.status(200).json(result);
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      // Audit log
      await auditLogger.logDeletion(userId, 'failure', {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        error: err.message,
      });

      // Monitor
      monitoring.trackOperation('delete', duration, false);

      logger.error('Deletion request failed', err, {
        path: req.path,
        method: req.method,
        body: req.body,
        userId,
      });
      throw error;
    }
  });

  /**
   * GET /api/gdpr/consent?userId={userId}
   * Get user consent status
   */
  router.get(
    '/consent',
    validate({ query: consentQuerySchema }),
    async (req: Request, res: Response): Promise<void> => {
      type ValidatedQuery = z.infer<typeof consentQuerySchema>;
      const validatedQuery = req.query as unknown as ValidatedQuery;
      const userId = req.userId ?? validatedQuery.userId;

      try {

      const consents = await gdprService.getConsentStatus(userId);

      // Audit log
      await auditLogger.logConsentRead(userId, 'success', {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(200).json(consents);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Audit log
      if (userId) {
        await auditLogger.logConsentRead(userId, 'failure', {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          error: err.message,
        });
      }

      logger.error('Get consent request failed', err, {
        path: req.path,
        method: req.method,
        query: req.query,
        userId,
      });
      throw error;
    }
    }
  );

  /**
   * POST /api/gdpr/consent
   * Update user consent
   */
  router.post(
    '/consent',
    validate({ body: consentUpdateRequestSchema }),
    async (req: Request, res: Response): Promise<void> => {
      const startTime = Date.now();
      type ValidatedBody = z.infer<typeof consentUpdateRequestSchema>;
      const validatedBody = req.body as unknown as ValidatedBody;
      const userId = req.userId ?? validatedBody.userId;

      try {
        const validated = validatedBody;
      // Extract IP address and user agent from request if not provided
      const request: ConsentUpdateRequest = {
        userId: validated.userId,
        category: validated.category,
        status: validated.status,
        version: validated.version,
        ...(validated.ipAddress !== undefined && { ipAddress: validated.ipAddress }),
        ...(validated.userAgent !== undefined && { userAgent: validated.userAgent }),
      };

      if (request.ipAddress === undefined) {
        const ip = req.ip ?? req.socket.remoteAddress;
        if (ip !== undefined) {
          request.ipAddress = ip;
        }
      }
      if (request.userAgent === undefined && req.headers['user-agent'] !== undefined) {
        request.userAgent = req.headers['user-agent'];
      }

      const consent = await gdprService.updateConsent(request);
      const duration = Date.now() - startTime;

      // Audit log
      await auditLogger.logConsentUpdate(userId, request.category, 'success', {
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        consentStatus: request.status,
      });

      // Monitor
      monitoring.trackOperation('consent_update', duration, true);

      res.status(200).json(consent);
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      // Audit log
      if (userId && req.body.category) {
        await auditLogger.logConsentUpdate(userId, req.body.category, 'failure', {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          error: err.message,
        });
      }

      // Monitor
      monitoring.trackOperation('consent_update', duration, false);

      logger.error('Update consent request failed', err, {
        path: req.path,
        method: req.method,
        body: req.body,
        userId,
      });
      throw error;
    }
  });

  return router;
}
