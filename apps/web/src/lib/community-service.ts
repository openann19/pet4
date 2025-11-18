/**
 * Community Service
 *
 * Handles community posts, comments, reactions, follows, and feeds.
 * Migrated from legacy KV mocks to use backend API endpoints.
 */

import type {
  CommunityPost,
  Comment,
  Reaction,
  SavedPost,
  Follow,
  Report,
  FeedOptions,
  FeedResponse,
  PostDraft,
  CommunityNotification,
  ReportReason,
} from './community-types';
import { communityApi } from '@/api/community-api-client';
import { createLogger } from './logger';
import { normalizeError } from './error-utils';

const logger = createLogger('CommunityService');

export const communityService = {
  async getFeed(options: FeedOptions): Promise<FeedResponse> {
    try {
      return await communityApi.getFeed(options);
    } catch (_error) {
      logger.error('Failed to get feed', normalizeError(_error), { options });
      return { posts: [], hasMore: false };
    }
  },

  async createPost(postData: Partial<CommunityPost>): Promise<CommunityPost> {
    try {
      return await communityApi.createPost({
        kind: postData.kind ?? 'photo',
        ...(postData.petIds ? { petIds: postData.petIds } : {}),
        ...(postData.text ? { text: postData.text } : {}),
        media: Array.isArray(postData.media)
          ? postData.media.filter((m): m is string => typeof m === 'string')
          : [],
        ...(postData.location ? { location: postData.location } : {}),
        ...(postData.tags ? { tags: postData.tags } : {}),
        visibility: postData.visibility ?? 'public',
      });
    } catch (_error) {
      logger.error('Failed to create post', normalizeError(_error));
      throw normalizeError(_error);
    }
  },

  async getPost(postId: string): Promise<CommunityPost | undefined> {
    try {
      const post = await communityApi.getPost(postId);
      return post ?? undefined;
    } catch (_error) {
      logger.error('Failed to get post', normalizeError(_error), { postId });
      return undefined;
    }
  },

  async deletePost(postId: string): Promise<void> {
    try {
      await communityApi.deletePost(postId);
    } catch (_error) {
      logger.error(
        'Failed to delete post',
        _error instanceof Error ? _error : new Error(String(_error)),
        { postId }
      );
      throw _error;
    }
  },

  async likePost(postId: string): Promise<Reaction> {
    try {
      return await communityApi.likePost(postId);
    } catch (_error) {
      logger.error(
        'Failed to like post',
        _error instanceof Error ? _error : new Error(String(_error)),
        { postId }
      );
      throw _error;
    }
  },

  async unlikePost(postId: string): Promise<void> {
    try {
      await communityApi.unlikePost(postId);
    } catch (_error) {
      logger.error(
        'Failed to unlike post',
        _error instanceof Error ? _error : new Error(String(_error)),
        { postId }
      );
      throw _error;
    }
  },

  async getPostLikes(postId: string): Promise<Reaction[]> {
    try {
      return await communityApi.getPostLikes(postId);
    } catch (_error) {
      logger.error(
        'Failed to get post likes',
        _error instanceof Error ? _error : new Error(String(_error)),
        { postId }
      );
      return [];
    }
  },

  async isPostLiked(postId: string): Promise<boolean> {
    try {
      return await communityApi.isPostLiked(postId);
    } catch (_error) {
      logger.error(
        'Failed to check if post is liked',
        _error instanceof Error ? _error : new Error(String(_error)),
        { postId }
      );
      return false;
    }
  },

  async getComments(postId: string, cursor?: string): Promise<Comment[]> {
    try {
      return await communityApi.getComments(postId, cursor);
    } catch (_error) {
      logger.error(
        'Failed to get comments',
        _error instanceof Error ? _error : new Error(String(_error)),
        { postId, cursor }
      );
      return [];
    }
  },

  async addComment(
    postId: string,
    commentData: { text: string; parentId?: string }
  ): Promise<Comment> {
    try {
      return await communityApi.addComment(postId, {
        text: commentData.text,
        ...(commentData.parentId !== undefined && { parentId: commentData.parentId }),
      });
    } catch (_error) {
      logger.error(
        'Failed to add comment',
        _error instanceof Error ? _error : new Error(String(_error)),
        { postId }
      );
      throw _error;
    }
  },

  async savePost(postId: string): Promise<SavedPost> {
    try {
      return await communityApi.savePost(postId);
    } catch (_error) {
      logger.error(
        'Failed to save post',
        _error instanceof Error ? _error : new Error(String(_error)),
        { postId }
      );
      throw _error;
    }
  },

  async unsavePost(postId: string): Promise<void> {
    try {
      await communityApi.unsavePost(postId);
    } catch (_error) {
      logger.error(
        'Failed to unsave post',
        _error instanceof Error ? _error : new Error(String(_error)),
        { postId }
      );
      throw _error;
    }
  },

  async getSavedPosts(): Promise<CommunityPost[]> {
    try {
      return await communityApi.getSavedPosts();
    } catch (_error) {
      logger.error(
        'Failed to get saved posts',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      return [];
    }
  },

  async isPostSaved(postId: string): Promise<boolean> {
    try {
      return await communityApi.isPostSaved(postId);
    } catch (_error) {
      logger.error(
        'Failed to check if post is saved',
        _error instanceof Error ? _error : new Error(String(_error)),
        { postId }
      );
      return false;
    }
  },

  async followUser(targetId: string, targetName: string): Promise<Follow> {
    try {
      return await communityApi.followUser(targetId, targetName);
    } catch (_error) {
      logger.error(
        'Failed to follow user',
        _error instanceof Error ? _error : new Error(String(_error)),
        { targetId }
      );
      throw _error;
    }
  },

  async unfollowUser(targetId: string): Promise<void> {
    try {
      await communityApi.unfollowUser(targetId);
    } catch (_error) {
      logger.error(
        'Failed to unfollow user',
        _error instanceof Error ? _error : new Error(String(_error)),
        { targetId }
      );
      throw _error;
    }
  },

  async isFollowing(targetId: string, type: 'user' | 'tag' | 'breed' = 'user'): Promise<boolean> {
    try {
      return await communityApi.isFollowing(targetId, type);
    } catch (_error) {
      logger.error(
        'Failed to check following status',
        _error instanceof Error ? _error : new Error(String(_error)),
        { targetId, type }
      );
      return false;
    }
  },

  async getTrendingTags(period: 'day' | 'week' | 'month' = 'day'): Promise<string[]> {
    try {
      return await communityApi.getTrendingTags(period);
    } catch (_error) {
      logger.error(
        'Failed to get trending tags',
        _error instanceof Error ? _error : new Error(String(_error)),
        { period }
      );
      return [];
    }
  },

  async reportContent(
    targetType: 'post' | 'comment' | 'user',
    targetId: string,
    reasons: ReportReason[],
    description?: string
  ): Promise<Report> {
    try {
      // Currently the backend API supports reporting posts by ID.
      // For comments and users we map the targetId through as the postId
      // so that moderation still receives the correct identifier.
      void targetType; // reserved for future expansion when API supports more resource types
      return await communityApi.reportContent(targetId, {
        reasons,
        ...(description !== undefined && { description }),
      });
    } catch (_error) {
      logger.error(
        'Failed to report content',
        _error instanceof Error ? _error : new Error(String(_error)),
        { targetType, targetId }
      );
      throw _error;
    }
  },

  async saveDraft(draft: Partial<PostDraft>): Promise<PostDraft> {
    try {
      return await communityApi.saveDraft(draft);
    } catch (_error) {
      logger.error(
        'Failed to save draft',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      throw _error;
    }
  },

  async getDrafts(): Promise<PostDraft[]> {
    try {
      return await communityApi.getDrafts();
    } catch (_error) {
      logger.error(
        'Failed to get drafts',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      return [];
    }
  },

  async deleteDraft(draftId: string): Promise<void> {
    try {
      await communityApi.deleteDraft(draftId);
    } catch (_error) {
      logger.error(
        'Failed to delete draft',
        _error instanceof Error ? _error : new Error(String(_error)),
        { draftId }
      );
      throw _error;
    }
  },

  createNotification(data: Partial<CommunityNotification> & { receiverId: string }): Promise<void> {
    // Notifications are now handled automatically by the backend API
    // This function is kept for compatibility but does nothing
    logger.debug('Notification creation handled by backend API', { notification: data });
    return Promise.resolve();
  },

  async getNotifications(): Promise<CommunityNotification[]> {
    try {
      return await communityApi.getNotifications();
    } catch (_error) {
      logger.error(
        'Failed to get notifications',
        _error instanceof Error ? _error : new Error(String(_error))
      );
      return [];
    }
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await communityApi.markNotificationRead(notificationId);
    } catch (_error) {
      logger.error(
        'Failed to mark notification as read',
        _error instanceof Error ? _error : new Error(String(_error)),
        { notificationId }
      );
      throw _error;
    }
  },
};
