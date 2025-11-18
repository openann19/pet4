/**
 * Photo Moderation Audit Service
 *
 * Tracks all state changes and actions for full audit trail.
 */

import { createLogger } from '@/lib/logger';
import type {
  PhotoModerationAction,
  PhotoModerationStatus,
  PhotoModerationAuditLog,
} from '@/core/domain/photo-moderation';
import { storage } from '@/lib/storage';

const logger = createLogger('PhotoModerationAudit');

const AUDIT_PREFIX = 'photo-moderation:audit:';
const AUDIT_INDEX_PREFIX = 'photo-moderation:audit-index:';

export interface AuditLogOptions {
  photoId: string;
  action: PhotoModerationAction;
  performedBy: string;
  reason?: string;
  previousStatus: PhotoModerationStatus;
  newStatus: PhotoModerationStatus;
  metadata?: Record<string, unknown>;
}

export class PhotoModerationAuditService {
  /**
   * Log audit event
   */
  async logEvent(options: AuditLogOptions): Promise<PhotoModerationAuditLog> {
    try {
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const auditLog: PhotoModerationAuditLog = {
        auditId,
        photoId: options.photoId,
        action: options.action,
        performedBy: options.performedBy,
        performedAt: now,
        ...(options.reason !== undefined && { reason: options.reason }),
        previousStatus: options.previousStatus,
        newStatus: options.newStatus,
        metadata: options.metadata ?? {},
      };

      const auditKey = `${AUDIT_PREFIX}${auditId}`;
      await storage.set(auditKey, auditLog);

      // Index by photo
      await this.indexByPhoto(options.photoId, auditId);

      // Index by user (moderator)
      await this.indexByUser(options.performedBy, auditId);

      // Index by action
      await this.indexByAction(options.action, auditId);

      logger.info('Audit event logged', {
        auditId,
        photoId: options.photoId,
        action: options.action,
        performedBy: options.performedBy,
      });

      return auditLog;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to log audit event', err, {
        photoId: options.photoId,
        action: options.action,
      });
      throw err;
    }
  }

  /**
   * Get audit logs for photo
   */
  async getPhotoAuditLogs(photoId: string): Promise<PhotoModerationAuditLog[]> {
    try {
      const indexKey = `${AUDIT_INDEX_PREFIX}photo:${photoId}`;
      const auditIds = (await storage.get<string[]>(indexKey)) ?? [];

      const logs: PhotoModerationAuditLog[] = [];
      for (const auditId of auditIds) {
        const auditKey = `${AUDIT_PREFIX}${auditId}`;
        const log = await storage.get<PhotoModerationAuditLog>(auditKey);
        if (log) {
          logs.push(log);
        }
      }

      // Sort by performedAt descending
      logs.sort((a, b) => {
        return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime();
      });

      return logs;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get photo audit logs', err, { photoId });
      throw err;
    }
  }

  /**
   * Get audit logs by user (moderator)
   */
  async getUserAuditLogs(userId: string, limit = 100): Promise<PhotoModerationAuditLog[]> {
    try {
      const indexKey = `${AUDIT_INDEX_PREFIX}user:${userId}`;
      const auditIds = (await storage.get<string[]>(indexKey)) ?? [];

      const logs: PhotoModerationAuditLog[] = [];
      for (const auditId of auditIds.slice(0, limit)) {
        const auditKey = `${AUDIT_PREFIX}${auditId}`;
        const log = await storage.get<PhotoModerationAuditLog>(auditKey);
        if (log) {
          logs.push(log);
        }
      }

      // Sort by performedAt descending
      logs.sort((a, b) => {
        return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime();
      });

      return logs;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get user audit logs', err, { userId });
      throw err;
    }
  }

  /**
   * Get audit logs by action
   */
  async getActionAuditLogs(
    action: PhotoModerationAction,
    limit = 100
  ): Promise<PhotoModerationAuditLog[]> {
    try {
      const indexKey = `${AUDIT_INDEX_PREFIX}action:${action}`;
      const auditIds = (await storage.get<string[]>(indexKey)) ?? [];

      const logs: PhotoModerationAuditLog[] = [];
      for (const auditId of auditIds.slice(0, limit)) {
        const auditKey = `${AUDIT_PREFIX}${auditId}`;
        const log = await storage.get<PhotoModerationAuditLog>(auditKey);
        if (log) {
          logs.push(log);
        }
      }

      // Sort by performedAt descending
      logs.sort((a, b) => {
        return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime();
      });

      return logs;
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get action audit logs', err, { action });
      throw err;
    }
  }

  /**
   * Index by photo
   */
  private async indexByPhoto(photoId: string, auditId: string): Promise<void> {
    try {
      const indexKey = `${AUDIT_INDEX_PREFIX}photo:${photoId}`;
      const auditIds = (await storage.get<string[]>(indexKey)) ?? [];

      if (!auditIds.includes(auditId)) {
        auditIds.push(auditId);
        await storage.set(indexKey, auditIds);
      }
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to index by photo', err, { photoId, auditId });
      throw err;
    }
  }

  /**
   * Index by user
   */
  private async indexByUser(userId: string, auditId: string): Promise<void> {
    try {
      const indexKey = `${AUDIT_INDEX_PREFIX}user:${userId}`;
      const auditIds = (await storage.get<string[]>(indexKey)) ?? [];

      if (!auditIds.includes(auditId)) {
        auditIds.push(auditId);
        await storage.set(indexKey, auditIds);
      }
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to index by user', err, { userId, auditId });
      throw err;
    }
  }

  /**
   * Index by action
   */
  private async indexByAction(action: PhotoModerationAction, auditId: string): Promise<void> {
    try {
      const indexKey = `${AUDIT_INDEX_PREFIX}action:${action}`;
      const auditIds = (await storage.get<string[]>(indexKey)) ?? [];

      if (!auditIds.includes(auditId)) {
        auditIds.push(auditId);
        await storage.set(indexKey, auditIds);
      }
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to index by action', err, { action, auditId });
      throw err;
    }
  }
}

export const photoModerationAudit = new PhotoModerationAuditService();
