/**
 * Admin Config Routes
 *
 * Express routes for admin configuration management (business, matching, map, api).
 * Handles CRUD operations with versioning, history tracking, and audit logging.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { AdminConfigService, type ConfigType } from '../services/admin-config-service';
import { ConfigHistoryService } from '../services/config-history-service';
import { AdminAuditLogger } from '../services/admin-audit-logger';
import { ValidationError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('AdminConfigRoutes');

export interface AdminConfigRoutesConfig {
  adminConfigService: AdminConfigService;
  configHistoryService: ConfigHistoryService;
  adminAuditLogger: AdminAuditLogger;
}

// Validation schemas
const configUpdateSchema = z.object({
  config: z.record(z.unknown()),
  updatedBy: z.string().min(1, 'UpdatedBy is required').optional(),
});

const configBroadcastSchema = z.object({
  configType: z.enum(['business', 'matching', 'map', 'api', 'system']),
  config: z.record(z.unknown()),
  timestamp: z.string().optional(),
});

/**
 * Compute differences between two config objects
 */
function computeConfigChanges(
  previous: Record<string, unknown> | null,
  current: Record<string, unknown>
): Record<string, unknown> {
  if (!previous) {
    return { _initial: true };
  }

  const changes: Record<string, unknown> = {};

  // Check for added or changed keys
  for (const [key, value] of Object.entries(current)) {
    if (!(key in previous)) {
      changes[`+${key}`] = value;
    } else if (JSON.stringify(previous[key]) !== JSON.stringify(value)) {
      changes[key] = { from: previous[key], to: value };
    }
  }

  // Check for removed keys
  for (const key of Object.keys(previous)) {
    if (!(key in current)) {
      changes[`-${key}`] = previous[key];
    }
  }

  return changes;
}

export function createAdminConfigRoutes(config: AdminConfigRoutesConfig): Router {
  const { adminConfigService, configHistoryService, adminAuditLogger } = config;
  const router = Router();

  /**
   * GET /api/v1/payments/business-config
   * Get business configuration
   */
  router.get('/payments/business-config', async (req: Request, res: Response): Promise<void> => {
    try {
      const config = await adminConfigService.getConfig('business');
      if (!config) {
        res.status(200).json({ config: null });
        return;
      }

      res.status(200).json({ config: config.config });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get business config', err);
      throw error;
    }
  });

  /**
   * PUT /api/v1/payments/business-config
   * Update business configuration
   */
  router.put('/payments/business-config', async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const userId = req.userId ?? req.body.updatedBy ?? 'admin';

    try {
      const validationResult = configUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request data', {
          errors: validationResult.error.errors,
        });
      }

      const previousConfig = await adminConfigService.getConfig('business');
      const previousVersion = previousConfig?.version ?? null;
      const previousConfigData = previousConfig?.config ?? null;

      const updatedConfig = await adminConfigService.updateConfig('business', {
        config: validationResult.data.config,
        updatedBy: userId,
      });

      // Create history entry
      const changes = computeConfigChanges(previousConfigData, updatedConfig.config);
      await configHistoryService.createHistoryEntry({
        configId: updatedConfig.id,
        configType: 'business',
        version: updatedConfig.version,
        previousVersion: previousVersion,
        changedBy: userId,
        changedByName: (req.user as { name?: string })?.name,
        changes,
        previousConfig: previousConfigData,
        newConfig: updatedConfig.config,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Audit log
      await adminAuditLogger.log({
        adminId: userId,
        adminName: (req.user as { name?: string })?.name,
        action: 'config_update',
        targetType: 'business_config',
        targetId: updatedConfig.id,
        details: { version: updatedConfig.version, changes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      logger.info('Business config updated', {
        userId,
        version: updatedConfig.version,
        duration: Date.now() - startTime,
      });

      res.status(200).json({ config: updatedConfig.config });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update business config', err, { userId });
      throw error;
    }
  });

  /**
   * GET /api/v1/matching/config
   * Get matching configuration
   */
  router.get('/matching/config', async (req: Request, res: Response): Promise<void> => {
    try {
      const config = await adminConfigService.getConfig('matching');
      if (!config) {
        res.status(200).json({ config: null });
        return;
      }

      res.status(200).json({ config: config.config });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get matching config', err);
      throw error;
    }
  });

  /**
   * PUT /api/v1/matching/config
   * Update matching configuration
   */
  router.put('/matching/config', async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const userId = req.userId ?? req.body.updatedBy ?? 'admin';

    try {
      const validationResult = configUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request data', {
          errors: validationResult.error.errors,
        });
      }

      const previousConfig = await adminConfigService.getConfig('matching');
      const previousVersion = previousConfig?.version ?? null;
      const previousConfigData = previousConfig?.config ?? null;

      const updatedConfig = await adminConfigService.updateConfig('matching', {
        config: validationResult.data.config,
        updatedBy: userId,
      });

      // Create history entry
      const changes = computeConfigChanges(previousConfigData, updatedConfig.config);
      await configHistoryService.createHistoryEntry({
        configId: updatedConfig.id,
        configType: 'matching',
        version: updatedConfig.version,
        previousVersion: previousVersion,
        changedBy: userId,
        changedByName: (req.user as { name?: string })?.name,
        changes,
        previousConfig: previousConfigData,
        newConfig: updatedConfig.config,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Audit log
      await adminAuditLogger.log({
        adminId: userId,
        adminName: (req.user as { name?: string })?.name,
        action: 'config_update',
        targetType: 'matching_config',
        targetId: updatedConfig.id,
        details: { version: updatedConfig.version, changes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      logger.info('Matching config updated', {
        userId,
        version: updatedConfig.version,
        duration: Date.now() - startTime,
      });

      res.status(200).json({ config: updatedConfig.config });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update matching config', err, { userId });
      throw error;
    }
  });

  /**
   * GET /api/v1/admin/config/map
   * Get map configuration
   */
  router.get('/admin/config/map', async (req: Request, res: Response): Promise<void> => {
    try {
      const config = await adminConfigService.getConfig('map');
      if (!config) {
        res.status(200).json({ config: null });
        return;
      }

      res.status(200).json({ config: config.config });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get map config', err);
      throw error;
    }
  });

  /**
   * PUT /api/v1/admin/config/map
   * Update map configuration
   */
  router.put('/admin/config/map', async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const userId = req.userId ?? req.body.updatedBy ?? 'admin';

    try {
      const validationResult = configUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request data', {
          errors: validationResult.error.errors,
        });
      }

      const previousConfig = await adminConfigService.getConfig('map');
      const previousVersion = previousConfig?.version ?? null;
      const previousConfigData = previousConfig?.config ?? null;

      const updatedConfig = await adminConfigService.updateConfig('map', {
        config: validationResult.data.config,
        updatedBy: userId,
      });

      // Create history entry
      const changes = computeConfigChanges(previousConfigData, updatedConfig.config);
      await configHistoryService.createHistoryEntry({
        configId: updatedConfig.id,
        configType: 'map',
        version: updatedConfig.version,
        previousVersion: previousVersion,
        changedBy: userId,
        changedByName: (req.user as { name?: string })?.name,
        changes,
        previousConfig: previousConfigData,
        newConfig: updatedConfig.config,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Audit log
      await adminAuditLogger.log({
        adminId: userId,
        adminName: (req.user as { name?: string })?.name,
        action: 'config_update',
        targetType: 'map_config',
        targetId: updatedConfig.id,
        details: { version: updatedConfig.version, changes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      logger.info('Map config updated', {
        userId,
        version: updatedConfig.version,
        duration: Date.now() - startTime,
      });

      res.status(200).json({ config: updatedConfig.config });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update map config', err, { userId });
      throw error;
    }
  });

  /**
   * GET /api/v1/admin/config/api
   * Get API configuration
   */
  router.get('/admin/config/api', async (req: Request, res: Response): Promise<void> => {
    try {
      const config = await adminConfigService.getConfig('api');
      if (!config) {
        res.status(200).json({ config: null });
        return;
      }

      res.status(200).json({ config: config.config });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get API config', err);
      throw error;
    }
  });

  /**
   * PUT /api/v1/admin/config/api
   * Update API configuration
   */
  router.put('/admin/config/api', async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const userId = req.userId ?? req.body.updatedBy ?? 'admin';

    try {
      const validationResult = configUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request data', {
          errors: validationResult.error.errors,
        });
      }

      const previousConfig = await adminConfigService.getConfig('api');
      const previousVersion = previousConfig?.version ?? null;
      const previousConfigData = previousConfig?.config ?? null;

      const updatedConfig = await adminConfigService.updateConfig('api', {
        config: validationResult.data.config,
        updatedBy: userId,
      });

      // Create history entry
      const changes = computeConfigChanges(previousConfigData, updatedConfig.config);
      await configHistoryService.createHistoryEntry({
        configId: updatedConfig.id,
        configType: 'api',
        version: updatedConfig.version,
        previousVersion: previousVersion,
        changedBy: userId,
        changedByName: (req.user as { name?: string })?.name,
        changes,
        previousConfig: previousConfigData,
        newConfig: updatedConfig.config,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Audit log
      await adminAuditLogger.log({
        adminId: userId,
        adminName: (req.user as { name?: string })?.name,
        action: 'config_update',
        targetType: 'api_config',
        targetId: updatedConfig.id,
        details: { version: updatedConfig.version, changes },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      logger.info('API config updated', {
        userId,
        version: updatedConfig.version,
        duration: Date.now() - startTime,
      });

      res.status(200).json({ config: updatedConfig.config });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update API config', err, { userId });
      throw error;
    }
  });

  /**
   * POST /api/v1/admin/config/broadcast
   * Broadcast configuration update (for real-time notifications)
   */
  router.post('/admin/config/broadcast', async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId ?? 'admin';

    try {
      const validationResult = configBroadcastSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request data', {
          errors: validationResult.error.errors,
        });
      }

      const { configType, config } = validationResult.data;

      // Update config if provided
      if (config && Object.keys(config).length > 0) {
        await adminConfigService.updateConfig(configType, {
          config,
          updatedBy: userId,
        });
      }

      // Get current config version
      const currentConfig = await adminConfigService.getConfig(configType);
      const version = currentConfig?.version ?? 1;

      // Audit log
      await adminAuditLogger.log({
        adminId: userId,
        adminName: (req.user as { name?: string })?.name,
        action: 'config_broadcast',
        targetType: `${configType}_config`,
        targetId: currentConfig?.id,
        details: { configType, version },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      logger.info('Config broadcast', {
        userId,
        configType,
        version,
      });

      res.status(200).json({
        success: true,
        version,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast config', err, { userId });
      throw error;
    }
  });

  /**
   * GET /api/v1/admin/config/history
   * Get configuration change history
   */
  router.get('/admin/config/history', async (req: Request, res: Response): Promise<void> => {
    try {
      const configType = req.query.type as ConfigType | undefined;
      const limit = req.query.limit
        ? Number.parseInt(String(req.query.limit), 10)
        : 50;

      if (!configType) {
        throw new ValidationError('Config type is required', {
          errors: [{ path: ['type'], message: 'Config type is required' }],
        });
      }

      const history = await configHistoryService.getConfigHistory(configType, limit);

      res.status(200).json(
        history.map((entry) => ({
          id: entry.id,
          configType: entry.configType,
          version: entry.version,
          previousVersion: entry.previousVersion,
          changedBy: entry.changedBy,
          changedByName: entry.changedByName,
          changes: entry.changes,
          timestamp: entry.timestamp.toISOString(),
        }))
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get config history', err);
      throw error;
    }
  });

  return router;
}
