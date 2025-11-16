/**
 * Photo Moderation API
 *
 * API layer for photo moderation operations.
 * Uses strict optional semantics for updates.
 * Composes specialized services for different concerns.
 */

import type {
  PhotoModerationAction,
  PhotoModerationMetadata,
  PhotoModerationRecord,
  PhotoModerationStatus,
} from '@/core/domain/photo-moderation';
import { PhotoQueryService } from './photo-moderation/services/photo-query-service';
import { PhotoStatusService } from './photo-moderation/services/photo-status-service';
import { PhotoSubmissionService } from './photo-moderation/services/photo-submission-service';
import type { OptionalWithUndef } from '@/types/optional-with-undef';

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
  private submissionService: PhotoSubmissionService;
  private statusService: PhotoStatusService;
  private queryService: PhotoQueryService;

  constructor() {
    this.submissionService = new PhotoSubmissionService();
    this.statusService = new PhotoStatusService();
    this.queryService = new PhotoQueryService();
  }

  /**
   * Submit photo for moderation
   */
  async submitPhoto(
    request: SubmitPhotoForModerationRequest
  ): Promise<PhotoModerationRecord> {
    return this.submissionService.submitPhoto(request);
  }

  /**
   * Scan photo
   */
  async scanPhoto(photoId: string, photoUrl: string): Promise<void> {
    return this.submissionService.scanPhoto(photoId, photoUrl);
  }

  /**
   * Update photo moderation status (admin action)
   */
  async updateStatus(
    request: UpdatePhotoModerationStatusRequest
  ): Promise<PhotoModerationRecord> {
    return this.statusService.updateStatus(request);
  }

  /**
   * Get photo moderation status
   */
  async getStatus(
    photoId: string,
    userId?: string
  ): Promise<GetPhotoModerationStatusResponse> {
    return this.statusService.getStatus(photoId, userId);
  }

  /**
   * Check if photo is visible (for public lists)
   */
  async isPhotoVisible(photoId: string, userId?: string): Promise<boolean> {
    return this.statusService.isPhotoVisible(photoId, userId);
  }

  /**
   * Get photos pending moderation
   */
  async getPendingPhotos(limit = 50): Promise<PhotoModerationRecord[]> {
    return this.queryService.getPendingPhotos(limit);
  }

  /**
   * Get quarantined photos
   */
  async getQuarantinedPhotos(limit = 50): Promise<PhotoModerationRecord[]> {
    return this.queryService.getQuarantinedPhotos(limit);
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
    return this.queryService.getQueueStats();
  }

  /**
   * Get audit logs for photo
   */
  async getAuditLogs(photoId: string) {
    return this.queryService.getAuditLogs(photoId);
  }
}

export const photoModerationAPI = new PhotoModerationAPI();
