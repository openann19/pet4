import type {
  PhotoModerationAction,
  PhotoModerationRecord,
  PhotoModerationStatus,
} from '@/core/domain/photo-moderation';
import { isPhotoVisible } from '@/core/domain/photo-moderation';
import {
  buildStatusUpdateData,
  logAndEmitStatusChange,
  updateModerationQueue,
  validateStatusTransition,
} from '@/api/photo-moderation-helpers';
import { photoModerationStorage } from '@/core/services/photo-moderation-storage';
import { normalizeError } from '@/lib/error-utils';
import { getKYCStatus } from '@/lib/kyc-service';
import { createLogger } from '@/lib/logger';
import type { OptionalWithUndef } from '@/types/optional-with-undef';

const logger = createLogger('PhotoStatusService');

export interface UpdateStatusRequest
  extends OptionalWithUndef<{
    status: PhotoModerationStatus;
    rejectionReason?: string;
  }> {
  photoId: string;
  action: PhotoModerationAction;
  performedBy: string;
  reason?: string;
}

export interface GetStatusResponse {
  record: PhotoModerationRecord;
  isVisible: boolean;
  requiresKYC: boolean;
}

export class PhotoStatusService {
  async updateStatus(request: UpdateStatusRequest): Promise<PhotoModerationRecord> {
    try {
      const record = await photoModerationStorage.getRecord(request.photoId);
      if (!record) {
        throw new Error(`Record not found: ${request.photoId}`);
      }

      const previousStatus = record.status;
      const newStatus = request.status ?? record.status;

      validateStatusTransition(previousStatus, newStatus);

      const updateData = buildStatusUpdateData(
        {
          status: newStatus,
          performedBy: request.performedBy,
          rejectionReason: request.rejectionReason,
        },
        record.status
      );
      const updatedRecord = await photoModerationStorage.updateRecord(
        request.photoId,
        updateData
      );

      await updateModerationQueue(request.photoId, newStatus);

      await logAndEmitStatusChange(
        {
          photoId: request.photoId,
          action: request.action,
          performedBy: request.performedBy,
          reason: request.reason,
          rejectionReason: request.rejectionReason,
        },
        previousStatus,
        newStatus
      );

      return updatedRecord;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to update photo moderation status', err, {
        photoId: request.photoId,
        action: request.action,
      });
      throw err;
    }
  }

  async getStatus(photoId: string, userId?: string): Promise<GetStatusResponse> {
    try {
      const record = await photoModerationStorage.getRecord(photoId);
      if (!record) {
        throw new Error(`Record not found: ${photoId}`);
      }

      // Check KYC status if required
      const kycVerified = await this.checkKYCStatus(record.kycRequired, userId);

      // Determine visibility
      const isVisible = isPhotoVisible(
        record.status,
        record.kycRequired,
        kycVerified
      );

      return {
        record,
        isVisible,
        requiresKYC: record.kycRequired,
      };
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get photo moderation status', err, { photoId });
      throw err;
    }
  }

  async isPhotoVisible(photoId: string, userId?: string): Promise<boolean> {
    try {
      const status = await this.getStatus(photoId, userId);
      return status.isVisible;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to check photo visibility', err, { photoId });
      return false;
    }
  }

  private async checkKYCStatus(
    kycRequired: boolean,
    userId?: string
  ): Promise<boolean> {
    if (!kycRequired || !userId) {
      return false;
    }
    const kycStatus = await getKYCStatus(userId);
    return kycStatus === 'verified';
  }
}

