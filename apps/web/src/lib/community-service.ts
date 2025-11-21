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
    } catch (error) {
      logger.error('Failed to get feed', normalizeError(error), { options });
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
    } catch (error) {
      logger.error('Failed to create post', normalizeError(error));
      throw normalizeError(error);
    }
  },

  async getPost(postId: string): Promise<CommunityPost | undefined> {
    try {
      const post = await communityApi.getPost(postId);
      return post ?? undefined;
    } catch (error) {
      logger.error('Failed to get post', normalizeError(error), { postId });
      return undefined;
    }
  },

  async deletePost(postId: string): Promise<void> {
    try {
      await communityApi.deletePost(postId);
    } catch (error) {
      logger.error(
        'Failed to delete post',
        error instanceof Error ? error : new Error(String(error)),
        { postId }
      );
      throw error;
    }
  },

  async likePost(postId: string): Promise<Reaction> {
    try {
      return await communityApi.likePost(postId);
    } catch (error) {
      logger.error(
        'Failed to like post',
        error instanceof Error ? error : new Error(String(error)),
        { postId }
      );
      throw error;
    }
  },

  async unlikePost(postId: string): Promise<void> {
    try {
      await communityApi.unlikePost(postId);
    } catch (error) {
      logger.error(
        'Failed to unlike post',
        error instanceof Error ? error : new Error(String(error)),
        { postId }
      );
      throw error;
    }
  },

  async getPostLikes(postId: string): Promise<Reaction[]> {
    try {
      return await communityApi.getPostLikes(postId);
    } catch (error) {
      logger.error(
        'Failed to get post likes',
        error instanceof Error ? error : new Error(String(error)),
        { postId }
      );
      return [];
    }
  },

  async isPostLiked(postId: string): Promise<boolean> {
    try {
      return await communityApi.isPostLiked(postId);
    } catch (error) {
      logger.error(
        'Failed to check if post is liked',
        error instanceof Error ? error : new Error(String(error)),
        { postId }
      );
      return false;
    }
  },

  async getComments(postId: string, cursor?: string): Promise<Comment[]> {
    try {
      return await communityApi.getComments(postId, cursor);
    } catch (error) {
      logger.error(
        'Failed to get comments',
        error instanceof Error ? error : new Error(String(error)),
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
    } catch (error) {
      logger.error(
        'Failed to add comment',
        error instanceof Error ? error : new Error(String(error)),
        { postId }
      );
      throw error;
    }
  },

  async savePost(postId: string): Promise<SavedPost> {
    try {
      return await communityApi.savePost(postId);
    } catch (error) {
      logger.error(
        'Failed to save post',
        error instanceof Error ? error : new Error(String(error)),
        { postId }
      );
      throw error;
    }
  },

  async unsavePost(postId: string): Promise<void> {
    try {
      await communityApi.unsavePost(postId);
    } catch (error) {
      logger.error(
        'Failed to unsave post',
        error instanceof Error ? error : new Error(String(error)),
        { postId }
      );
      throw error;
    }
  },

  async getSavedPosts(): Promise<CommunityPost[]> {
    try {
      return await communityApi.getSavedPosts();
    } catch (error) {
      logger.error(
        'Failed to get saved posts',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  },

  async isPostSaved(postId: string): Promise<boolean> {
    try {
      return await communityApi.isPostSaved(postId);
    } catch (error) {
      logger.error(
        'Failed to check if post is saved',
        error instanceof Error ? error : new Error(String(error)),
        { postId }
      );
      return false;
    }
  },

  async followUser(targetId: string, targetName: string): Promise<Follow> {
    try {
      return await communityApi.followUser(targetId, targetName);
    } catch (error) {
      logger.error(
        'Failed to follow user',
        error instanceof Error ? error : new Error(String(error)),
        { targetId }
      );
      throw error;
    }
  },

  async unfollowUser(targetId: string): Promise<void> {
    try {
      await communityApi.unfollowUser(targetId);
    } catch (error) {
      logger.error(
        'Failed to unfollow user',
        error instanceof Error ? error : new Error(String(error)),
        { targetId }
      );
      throw error;
    }
  },

  async isFollowing(targetId: string, type: 'user' | 'tag' | 'breed' = 'user'): Promise<boolean> {
    try {
      return await communityApi.isFollowing(targetId, type);
    } catch (error) {
      logger.error(
        'Failed to check following status',
        error instanceof Error ? error : new Error(String(error)),
        { targetId, type }
      );
      return false;
    }
  },

  async getTrendingTags(period: 'day' | 'week' | 'month' = 'day'): Promise<string[]> {
    try {
      return await communityApi.getTrendingTags(period);
    } catch (error) {
      logger.error(
        'Failed to get trending tags',
        error instanceof Error ? error : new Error(String(error)),
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
      return await communityApi.reportContent(targetId, {
        reasons,
        ...(description !== undefined && { description }),
      });
    } catch (error) {
      logger.error(
        'Failed to report content',
        error instanceof Error ? error : new Error(String(error)),
        { targetType, targetId }
      );
      throw error;
    }
  },

  async saveDraft(draft: Partial<PostDraft>): Promise<PostDraft> {
    try {
      return await communityApi.saveDraft(draft);
    } catch (error) {
      logger.error(
        'Failed to save draft',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  },

  async getDrafts(): Promise<PostDraft[]> {
    try {
      return await communityApi.getDrafts();
    } catch (error) {
      logger.error(
        'Failed to get drafts',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  },

  async deleteDraft(draftId: string): Promise<void> {
    try {
      await communityApi.deleteDraft(draftId);
    } catch (error) {
      logger.error(
        'Failed to delete draft',
        error instanceof Error ? error : new Error(String(error)),
        { draftId }
      );
      throw error;
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
    } catch (error) {
      logger.error(
        'Failed to get notifications',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await communityApi.markNotificationRead(notificationId);
    } catch (error) {
      logger.error(
        'Failed to mark notification as read',
        error instanceof Error ? error : new Error(String(error)),
        { notificationId }
      );
      throw error;
    }
  },
};
