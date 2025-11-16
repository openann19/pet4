import type {
  PhotoModerationMetadata,
  PhotoModerationRecord,
  PhotoScanResult,
} from '@/core/domain/photo-moderation';
import { photoModerationEvents } from '@/core/services/photo-moderation-events';
import { photoModerationQueue } from '@/core/services/photo-moderation-queue';
import { photoModerationStorage } from '@/core/services/photo-moderation-storage';
import { photoScanningService } from '@/core/services/photo-scanning';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PhotoSubmissionService');

export interface SubmitPhotoRequest {
  photoId: string;
  photoUrl: string;
  metadata: PhotoModerationMetadata;
  kycRequired?: boolean;
}

export class PhotoSubmissionService {
  async submitPhoto(request: SubmitPhotoRequest): Promise<PhotoModerationRecord> {
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
      const err = normalizeError(error);
      logger.error('Failed to submit photo for moderation', err, {
        photoId: request.photoId,
      });
      throw err;
    }
  }

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
      const scanResult = (await photoScanningService.scanPhoto({
        photoUrl,
        metadata: record.metadata,
      })) as PhotoScanResult;

      // Determine next status
      const nextStatus = this.determineNextStatus(scanResult, record.kycRequired);

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
      const err = normalizeError(error);
      logger.error('Failed to scan photo', err, { photoId });
      throw err;
    }
  }

  private determineNextStatus(
    scanResult: PhotoScanResult,
    kycRequired: boolean
  ): 'pending' | 'approved' | 'quarantined' | 'held_for_kyc' {
    if (photoScanningService.shouldAutoApprove(scanResult)) {
      return 'approved';
    }
    if (photoScanningService.shouldQuarantine(scanResult)) {
      return 'quarantined';
    }
    if (kycRequired) {
      return 'held_for_kyc';
    }
    return 'pending';
  }
}

