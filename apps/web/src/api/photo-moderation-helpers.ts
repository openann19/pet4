import type {
  PhotoModerationAction,
  PhotoModerationStatus,
} from '@/core/domain/photo-moderation';
import { isValidStatusTransition } from '@/core/domain/photo-moderation';
import { photoModerationAudit } from '@/core/services/photo-moderation-audit';
import { photoModerationEvents } from '@/core/services/photo-moderation-events';
import { photoModerationQueue } from '@/core/services/photo-moderation-queue';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PhotoModerationHelpers');

/**
 * Builds update data for photo moderation status update
 */
export function buildStatusUpdateData(
  request: {
    status?: PhotoModerationStatus;
    performedBy: string;
    rejectionReason?: string;
  },
  currentStatus: PhotoModerationStatus
): {
  status: PhotoModerationStatus;
  moderatedBy: string;
  rejectionReason?: string;
} {
  const updateData: {
    status: PhotoModerationStatus;
    moderatedBy: string;
    rejectionReason?: string;
  } = {
    status: request.status ?? currentStatus,
    moderatedBy: request.performedBy,
  };
  if (request.rejectionReason !== undefined) {
    updateData.rejectionReason = request.rejectionReason;
  }
  return updateData;
}

/**
 * Builds audit log options for photo moderation
 */
export function buildAuditLogOptions(
  request: {
    photoId: string;
    action: PhotoModerationAction;
    performedBy: string;
    reason?: string;
    rejectionReason?: string;
  },
  previousStatus: PhotoModerationStatus,
  newStatus: PhotoModerationStatus
): {
  photoId: string;
  action: PhotoModerationAction;
  performedBy: string;
  previousStatus: PhotoModerationStatus;
  newStatus: PhotoModerationStatus;
  metadata: {
    rejectionReason?: string;
  };
  reason?: string;
} {
  const auditMetadata: { rejectionReason?: string } = {};
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
  return auditLogOptions;
}

/**
 * Validates status transition
 */
export function validateStatusTransition(
  previousStatus: PhotoModerationStatus,
  newStatus: PhotoModerationStatus
): void {
  if (!isValidStatusTransition(previousStatus, newStatus)) {
    throw new Error(`Invalid status transition from ${previousStatus} to ${newStatus}`);
  }
}

/**
 * Updates moderation queue based on new status
 */
export async function updateModerationQueue(
  photoId: string,
  newStatus: PhotoModerationStatus
): Promise<void> {
  if (newStatus === 'approved' || newStatus === 'rejected') {
    await photoModerationQueue.dequeue(photoId);
  } else {
    await photoModerationQueue.updateStatus(photoId, newStatus);
  }
}

/**
 * Logs audit event and emits state change
 */
export async function logAndEmitStatusChange(
  request: {
    photoId: string;
    action: PhotoModerationAction;
    performedBy: string;
    reason?: string;
    rejectionReason?: string;
  },
  previousStatus: PhotoModerationStatus,
  newStatus: PhotoModerationStatus
): Promise<void> {
  const auditLogOptions = buildAuditLogOptions(request, previousStatus, newStatus);
  await photoModerationAudit.logEvent(auditLogOptions);

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
}
