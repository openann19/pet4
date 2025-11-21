import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { createLogger } from '@/lib/logger';
import type { QueuedOperation } from './use-offline-queue';

const logger = createLogger('queue-processor');

/**
 * Execute API operation based on operation type and resource type
 */
export async function executeAPIOperation(operation: QueuedOperation): Promise<void> {
  const { type, resourceType, resourceId, data } = operation;

  try {
    switch (resourceType) {
      case 'message': {
        if (type === 'send-message' && resourceId) {
          await APIClient.post(ENDPOINTS.CHAT.SEND_MESSAGE(resourceId), data);
        }
        break;
      }

      case 'post': {
        if (type === 'create') {
          await APIClient.post(ENDPOINTS.COMMUNITY.CREATE_POST, data);
        } else if (type === 'update' && resourceId) {
          await APIClient.patch(ENDPOINTS.COMMUNITY.POST(resourceId), data);
        } else if (type === 'delete' && resourceId) {
          await APIClient.delete(ENDPOINTS.COMMUNITY.POST(resourceId));
        }
        break;
      }

      case 'reaction': {
        if (type === 'react' && resourceId) {
          await APIClient.post(ENDPOINTS.COMMUNITY.LIKE_POST(resourceId), data);
        }
        break;
      }

      case 'comment': {
        if (type === 'create' && resourceId) {
          await APIClient.post(ENDPOINTS.COMMUNITY.COMMENT(resourceId), data);
        }
        break;
      }

      case 'pet': {
        if (type === 'create') {
          await APIClient.post(ENDPOINTS.USERS.PROFILE, data);
        } else if (type === 'update') {
          await APIClient.patch(ENDPOINTS.USERS.UPDATE_PROFILE, data);
        }
        break;
      }

      case 'adoption': {
        if (type === 'create') {
          await APIClient.post(ENDPOINTS.ADOPTION.CREATE_LISTING, data);
        } else if (type === 'update' && resourceId) {
          await APIClient.patch(ENDPOINTS.ADOPTION.UPDATE_LISTING(resourceId), data);
        } else if (type === 'delete' && resourceId) {
          await APIClient.delete(ENDPOINTS.ADOPTION.DELETE_LISTING(resourceId));
        }
        break;
      }

      case 'upload': {
        if (type === 'upload') {
          await APIClient.post(ENDPOINTS.UPLOADS.SIGN_URL, data);
        }
        break;
      }

      default: {
        // For custom operations, use the SYNC endpoint
        if (type === 'custom') {
          await APIClient.post(ENDPOINTS.SYNC.SYNC_ACTION, {
            action: resourceType,
            data,
            resourceId,
          });
        } else {
          logger.warn('Unknown operation type/resource type combination', {
            type,
            resourceType,
            id: operation.id,
          });
          // Fallback: Use generic sync endpoint
          await APIClient.post(ENDPOINTS.SYNC.SYNC_ACTION, {
            type,
            resourceType,
            resourceId,
            data,
          });
        }
        break;
      }
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('API operation failed', {
      id: operation.id,
      type,
      resourceType,
      error: err,
    });
    throw err;
  }
}
