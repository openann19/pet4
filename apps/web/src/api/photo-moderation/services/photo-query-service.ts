import type { PhotoModerationRecord } from '@/core/domain/photo-moderation';
import { photoModerationAudit } from '@/core/services/photo-moderation-audit';
import { photoModerationQueue } from '@/core/services/photo-moderation-queue';
import { photoModerationStorage } from '@/core/services/photo-moderation-storage';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PhotoQueryService');

export class PhotoQueryService {
  async getPendingPhotos(limit = 50): Promise<PhotoModerationRecord[]> {
    try {
      return await photoModerationStorage.getRecordsByStatus('pending', limit);
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get pending photos', err);
      throw err;
    }
  }

  async getQuarantinedPhotos(limit = 50): Promise<PhotoModerationRecord[]> {
    try {
      return await photoModerationStorage.getRecordsByStatus('quarantined', limit);
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get quarantined photos', err);
      throw err;
    }
  }

  async getQueueStats(): Promise<{
    pending: number;
    scanning: number;
    heldForKYC: number;
    quarantined: number;
    total: number;
  }> {
    try {
      return await photoModerationQueue.getStats();
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get queue stats', err);
      throw err;
    }
  }

  async getAuditLogs(photoId: string) {
    try {
      return await photoModerationAudit.getPhotoAuditLogs(photoId);
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get audit logs', err, { photoId });
      throw err;
    }
  }
}

