/**
 * Photo Moderation API
 *
 * API layer for photo moderation operations.
 * Uses strict optional semantics for updates.
 */

import type {
  PhotoModerationAction,
  PhotoModerationMetadata,
  PhotoModerationRecord,
  PhotoModerationStatus,
} from '@/core/domain/photo-moderation';
import { isPhotoVisible, isValidStatusTransition } from '@/core/domain/photo-moderation';
import { photoModerationAudit } from '@/core/services/photo-moderation-audit';
import { photoModerationEvents } from '@/core/services/photo-moderation-events';
import { photoModerationQueue } from '@/core/services/photo-moderation-queue';
import { photoModerationStorage } from '@/core/services/photo-moderation-storage';
import { photoScanningService } from '@/core/services/photo-scanning';
import { getKYCStatus } from '@/lib/kyc-service';
import { createLogger } from '@/lib/logger';
import type { OptionalWithUndef } from '@/types/optional-with-undef';

const logger = createLogger('PhotoModerationAPI');

export interface SubmitPhotoForModerationRequest {
  photoId: string;
  photoUrl: string;
  metadata: PhotoModerationMetadata;
  kycRequired?: boolean;
}

export interface UpdatePhotoModerationStatusRequest
  extends OptionalWithUndef<{
    status: PhotoModerationStatus;
    rejectionReason?: string;
  }> {
  photoId: string;
  action: PhotoModerationAction;
  performedBy: string;
  reason?: string;
}

export interface GetPhotoModerationStatusResponse {
  record: PhotoModerationRecord;
  isVisible: boolean;
  requiresKYC: boolean;
}

export class PhotoModerationAPI {
  /**
   * Submit photo for moderation
   */
  async submitPhoto(request: SubmitPhotoForModerationRequest): Promise<PhotoModerationRecord> {
    try {
      const kycRequired = request.kycRequired ?? false;

      // Create moderation record
      const record = await photoModerationStorage.createRecord({
        photoId: request.photoId,
        metadata: request.metadata,
        kycRequired,
      });

      // Add to queue
      await photoModerationQueue.enqueue(request.photoId, 0);

      // Start scanning
      await this.scanPhoto(request.photoId, request.photoUrl);

      // Emit event
      await photoModerationEvents.emitStateChange(
        request.photoId,
        request.metadata.uploadedBy,
        'approve',
        'pending',
        record.status,
        { submitted: true }
      );

      logger.info('Photo submitted for moderation', {
        photoId: request.photoId,
        userId: request.metadata.uploadedBy,
      });

      return record;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to submit photo for moderation', err, {
        photoId: request.photoId,
      });
      throw err;
    }
  }

  /**
   * Scan photo
   */
  async scanPhoto(photoId: string, photoUrl: string): Promise<void> {
    try {
      const record = await photoModerationStorage.getRecord(photoId);
      if (!record) {
        throw new Error(`Record not found: ${photoId}`);
      }

      // Update status to scanning
      await photoModerationStorage.updateRecord(photoId, {
        status: 'scanning',
      });
      await photoModerationQueue.updateStatus(photoId, 'scanning');

      // Perform scan
      const scanResult = await photoScanningService.scanPhoto({
        photoUrl,
        metadata: record.metadata,
      });

      // Determine next status
      let nextStatus: PhotoModerationStatus = 'pending';

      if (photoScanningService.shouldAutoApprove(scanResult)) {
        nextStatus = 'approved';
      } else if (photoScanningService.shouldQuarantine(scanResult)) {
        nextStatus = 'quarantined';
      } else if (record.kycRequired) {
        nextStatus = 'held_for_kyc';
      }

      // Update record with scan result
      await photoModerationStorage.updateRecord(photoId, {
        status: nextStatus,
        scanResult,
      });
      await photoModerationQueue.updateStatus(photoId, nextStatus);

      // Emit event
      await photoModerationEvents.emitStateChange(
        photoId,
        record.metadata.uploadedBy,
        'approve',
        'scanning',
        nextStatus,
        { scanCompleted: true }
      );

      logger.info('Photo scan completed', {
        photoId,
        status: nextStatus,
        nsfwScore: scanResult.nsfwScore,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to scan photo', err, { photoId });
      throw err;
    }
  }

  /**
   * Update photo moderation status (admin action)
   */
  async updateStatus(request: UpdatePhotoModerationStatusRequest): Promise<PhotoModerationRecord> {
    try {
      const record = await photoModerationStorage.getRecord(request.photoId);
      if (!record) {
        throw new Error(`Record not found: ${request.photoId}`);
      }

      const previousStatus = record.status;
      const newStatus = request.status ?? record.status;

      // Validate transition
      if (!isValidStatusTransition(previousStatus, newStatus)) {
        throw new Error(`Invalid status transition from ${previousStatus} to ${newStatus}`);
      }

      // Update record
      const updateData: {
        status: PhotoModerationStatus;
        moderatedBy: string;
        rejectionReason?: string;
      } = {
        status: newStatus,
        moderatedBy: request.performedBy,
      };
      if (request.rejectionReason !== undefined) {
        updateData.rejectionReason = request.rejectionReason;
      }
      const updatedRecord = await photoModerationStorage.updateRecord(request.photoId, updateData);

      // Update queue
      if (newStatus === 'approved' || newStatus === 'rejected') {
        await photoModerationQueue.dequeue(request.photoId);
      } else {
        await photoModerationQueue.updateStatus(request.photoId, newStatus);
      }

      // Log audit
      const auditMetadata: {
        rejectionReason?: string;
      } = {};
      if (request.rejectionReason !== undefined) {
        auditMetadata.rejectionReason = request.rejectionReason;
      }
      const auditLogOptions: {
        photoId: string;
        action: PhotoModerationAction;
        performedBy: string;
        previousStatus: PhotoModerationStatus;
        newStatus: PhotoModerationStatus;
        metadata: {
          rejectionReason?: string;
        };
        reason?: string;
      } = {
        photoId: request.photoId,
        action: request.action,
        performedBy: request.performedBy,
        previousStatus,
        newStatus,
        metadata: auditMetadata,
      };
      if (request.reason !== undefined) {
        auditLogOptions.reason = request.reason;
      }
      await photoModerationAudit.logEvent(auditLogOptions);

      // Emit event
      await photoModerationEvents.emitStateChange(
        request.photoId,
        request.performedBy,
        request.action,
        previousStatus,
        newStatus,
        {
          reason: request.reason,
          rejectionReason: request.rejectionReason,
        }
      );

      logger.info('Photo moderation status updated', {
        photoId: request.photoId,
        action: request.action,
        previousStatus,
        newStatus,
        performedBy: request.performedBy,
      });

      return updatedRecord;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to update photo moderation status', err, {
        photoId: request.photoId,
        action: request.action,
      });
      throw err;
    }
  }

  /**
   * Get photo moderation status
   */
  async getStatus(photoId: string, userId?: string): Promise<GetPhotoModerationStatusResponse> {
    try {
      const record = await photoModerationStorage.getRecord(photoId);
      if (!record) {
        throw new Error(`Record not found: ${photoId}`);
      }

      // Check KYC status if required
      let kycVerified = false;
      if (record.kycRequired && userId) {
        const kycStatus = await getKYCStatus(userId);
        kycVerified = kycStatus === 'verified';
      }

      // Determine visibility
      const isVisible = isPhotoVisible(record.status, record.kycRequired, kycVerified);

      return {
        record,
        isVisible,
        requiresKYC: record.kycRequired,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get photo moderation status', err, { photoId });
      throw err;
    }
  }

  /**
   * Check if photo is visible (for public lists)
   */
  async isPhotoVisible(photoId: string, userId?: string): Promise<boolean> {
    try {
      const status = await this.getStatus(photoId, userId);
      return status.isVisible;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to check photo visibility', err, { photoId });
      return false;
    }
  }

  /**
   * Get photos pending moderation
   */
  async getPendingPhotos(limit = 50): Promise<PhotoModerationRecord[]> {
    try {
      return await photoModerationStorage.getRecordsByStatus('pending', limit);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get pending photos', err);
      throw err;
    }
  }

  /**
   * Get quarantined photos
   */
  async getQuarantinedPhotos(limit = 50): Promise<PhotoModerationRecord[]> {
    try {
      return await photoModerationStorage.getRecordsByStatus('quarantined', limit);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get quarantined photos', err);
      throw err;
    }
  }

  /**
   * Get queue statistics
   */
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
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get queue stats', err);
      throw err;
    }
  }

  /**
   * Get audit logs for photo
   */
  async getAuditLogs(photoId: string) {
    try {
      return await photoModerationAudit.getPhotoAuditLogs(photoId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get audit logs', err, { photoId });
      throw err;
    }
  }
}

export const photoModerationAPI = new PhotoModerationAPI();
