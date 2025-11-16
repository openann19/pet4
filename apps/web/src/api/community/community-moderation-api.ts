import { isValidPostStatusTransition } from '@/core/domain/community';
import { APIClient } from '@/lib/api-client';
import type { ReportData } from '@/lib/community-types';
import type { Report } from '@/lib/contracts';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';
import type { AppealModerationRequest, GetReportsResponse, ReportContentRequest } from '../community-api-types';

const logger = createLogger('CommunityModerationApi');

/**
 * Moderation and reporting API methods
 */
export class CommunityModerationApi {
  async reportContent(data: ReportData & { reporterId: string }): Promise<void> {
    try {
      const request: ReportContentRequest = {
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        reason: data.reason,
        details: data.details,
        reporterId: data.reporterId,
      };

      await APIClient.post('/api/v1/community/reports', request);
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to report content', err, { resourceId: data.resourceId });
      throw err;
    }
  }

  async appealModeration(
    resourceId: string,
    resourceType: 'post' | 'comment' | 'user',
    userId: string,
    userName: string,
    appealText: string,
    reportId?: string
  ): Promise<void> {
    try {
      // Note: 'hidden' is not a valid PostStatus in the type system
      // This check is kept for runtime validation but may need adjustment
      // if the backend supports 'hidden' status
      if (!isValidPostStatusTransition('archived', 'pending_review')) {
        throw new Error('Invalid status transition for appeal');
      }

      const request: AppealModerationRequest = {
        resourceId,
        resourceType,
        userId,
        userName,
        appealText,
        ...(reportId ? { reportId } : {}),
      };

      await APIClient.post(`/api/v1/community/appeals`, request);
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to submit appeal', err, { resourceId, userId });
      throw err;
    }
  }

  async getReportsForModeration(filters?: {
    status?: Report['status'][];
    entityType?: Report['reportedEntityType'][];
    limit?: number;
  }): Promise<Report[]> {
    try {
      const queryParams: Record<string, unknown> = {};

      if (filters?.status && filters.status.length > 0) {
        queryParams.status = filters.status;
      }

      if (filters?.entityType && filters.entityType.length > 0) {
        queryParams.entityType = filters.entityType;
      }

      if (filters?.limit) {
        queryParams.limit = filters.limit;
      }

      const url =
        '/community/reports' +
        (Object.keys(queryParams).length > 0
          ? '?' +
            new URLSearchParams(
              Object.entries(queryParams).map(([k, v]) => [k, String(v)])
            ).toString()
          : '');

      const response = await APIClient.get<GetReportsResponse>(url);
      return response.data.reports;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get reports for moderation', err, { filters });
      throw err;
    }
  }
}

