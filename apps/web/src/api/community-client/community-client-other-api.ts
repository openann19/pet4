import { APIClient } from '@/lib/api-client';
import { normalizeError } from '@/lib/error-utils';
import type {
  CommunityNotification,
  PostDraft,
  Report,
} from '@/lib/community-types';
import { createLogger } from '@/lib/logger';
import type { ReportContentRequest } from '../community-api-client-types';

const logger = createLogger('CommunityClientOtherApi');

/**
 * Other community API methods (reports, drafts, notifications, trending)
 */
export class CommunityClientOtherApi {
  async getTrendingTags(period: 'day' | 'week' | 'month' = 'day'): Promise<string[]> {
    try {
      const response = await APIClient.get<{ tags: string[] }>(
        `/api/v1/community/trending/tags?period=${period}`
      );
      return response.data.tags;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get trending tags', err, { period });
      throw err;
    }
  }

  async reportContent(
    postId: string,
    request: ReportContentRequest
  ): Promise<Report> {
    try {
      const response = await APIClient.post<{ report: Report }>(
        `/api/v1/community/posts/${postId}/report`,
        request
      );
      return response.data.report;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to report content', err, { postId });
      throw err;
    }
  }

  async saveDraft(draft: Partial<PostDraft>): Promise<PostDraft> {
    try {
      const response = await APIClient.post<{ draft: PostDraft }>(
        '/api/v1/community/drafts',
        draft
      );
      return response.data.draft;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to save draft', err);
      throw err;
    }
  }

  async getDrafts(): Promise<PostDraft[]> {
    try {
      const response = await APIClient.get<{ drafts: PostDraft[] }>(
        '/api/v1/community/drafts'
      );
      return response.data.drafts;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get drafts', err);
      throw err;
    }
  }

  async deleteDraft(draftId: string): Promise<void> {
    try {
      await APIClient.delete(`/api/v1/community/drafts/${draftId}`);
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to delete draft', err, { draftId });
      throw err;
    }
  }

  async getNotifications(): Promise<CommunityNotification[]> {
    try {
      const response = await APIClient.get<{ notifications: CommunityNotification[] }>(
        '/api/v1/community/notifications'
      );
      return response.data.notifications;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get notifications', err);
      throw err;
    }
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await APIClient.post(`/api/v1/community/notifications/${notificationId}/read`, {});
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to mark notification as read', err, { notificationId });
      throw err;
    }
  }
}

