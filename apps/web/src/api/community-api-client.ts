/**
 * Community API Service
 *
 * Handles community posts, comments, reactions, follows, and feeds through backend API.
 */

import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
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
  PostKind,
  PostVisibility,
} from '@/lib/community-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CommunityApi');

export type GetFeedRequest = FeedOptions;

export interface CreatePostRequest {
  kind: PostKind;
  petIds?: string[];
  text?: string;
  media?: string[];
  location?: {
    city?: string;
    country?: string;
    lat?: number;
    lon?: number;
    lng?: number;
    privacyRadiusM?: number;
    placeId?: string;
    placeName?: string;
  };
  tags?: string[];
  visibility: PostVisibility;
}

export interface AddCommentRequest {
  text: string;
  parentId?: string;
}

export interface ReportContentRequest {
  reasons: ReportReason[];
  description?: string;
}

class CommunityApiImpl {
  /**
   * Get community feed
   */
  async getFeed(options: FeedOptions): Promise<FeedResponse> {
    try {
      const params = new URLSearchParams();
      params.append('mode', options.mode);
      if (options.lat !== undefined) params.append('lat', String(options.lat));
      if (options.lng !== undefined) params.append('lng', String(options.lng));
      if (options.cursor !== undefined) params.append('cursor', options.cursor);
      if (options.limit !== undefined) params.append('limit', String(options.limit));

      const query = params.toString();
      const response = await APIClient.get<FeedResponse>(
        `${ENDPOINTS.COMMUNITY.POSTS}${query ? `?${query}` : ''}`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get feed', err, { options });
      throw err;
    }
  }

  /**
   * Create a new post
   */
  async createPost(request: CreatePostRequest): Promise<CommunityPost> {
    try {
      const response = await APIClient.post<CommunityPost>(
        ENDPOINTS.COMMUNITY.CREATE_POST,
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to create post', err);
      throw err;
    }
  }

  /**
   * Get a single post
   */
  async getPost(postId: string): Promise<CommunityPost | null> {
    try {
      const response = await APIClient.get<CommunityPost>(ENDPOINTS.COMMUNITY.POST(postId));
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // Return null if not found (404)
      if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) {
        return null;
      }
      logger.error('Failed to get post', err, { postId });
      throw err;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await APIClient.delete(ENDPOINTS.COMMUNITY.POST(postId));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete post', err, { postId });
      throw err;
    }
  }

  /**
   * Like/unlike a post
   */
  async likePost(postId: string): Promise<Reaction> {
    try {
      const response = await APIClient.post<Reaction>(ENDPOINTS.COMMUNITY.LIKE_POST(postId), {});
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to like post', err, { postId });
      throw err;
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string): Promise<void> {
    try {
      await APIClient.delete(`${ENDPOINTS.COMMUNITY.LIKE_POST(postId)}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to unlike post', err, { postId });
      throw err;
    }
  }

  /**
   * Get post likes/reactions
   */
  async getPostLikes(postId: string): Promise<Reaction[]> {
    try {
      const response = await APIClient.get<Reaction[]>(
        `${ENDPOINTS.COMMUNITY.POST(postId)}/reactions`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get post likes', err, { postId });
      return [];
    }
  }

  /**
   * Check if post is liked
   */
  async isPostLiked(postId: string): Promise<boolean> {
    try {
      const response = await APIClient.get<{ liked: boolean }>(
        `${ENDPOINTS.COMMUNITY.POST(postId)}/liked`
      );
      return response.data.liked;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to check if post is liked', err, { postId });
      return false;
    }
  }

  /**
   * Get comments for a post
   */
  async getComments(postId: string, cursor?: string): Promise<Comment[]> {
    try {
      const query = cursor ? `?cursor=${cursor}` : '';
      const response = await APIClient.get<Comment[]>(
        `${ENDPOINTS.COMMUNITY.COMMENT(postId)}${query}`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get comments', err, { postId, cursor });
      return [];
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, request: AddCommentRequest): Promise<Comment> {
    try {
      const response = await APIClient.post<Comment>(ENDPOINTS.COMMUNITY.COMMENT(postId), request);
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to add comment', err, { postId });
      throw err;
    }
  }

  /**
   * Save a post
   */
  async savePost(postId: string): Promise<SavedPost> {
    try {
      const response = await APIClient.post<SavedPost>(
        `${ENDPOINTS.COMMUNITY.POST(postId)}/save`,
        {}
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save post', err, { postId });
      throw err;
    }
  }

  /**
   * Unsave a post
   */
  async unsavePost(postId: string): Promise<void> {
    try {
      await APIClient.delete(`${ENDPOINTS.COMMUNITY.POST(postId)}/save`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to unsave post', err, { postId });
      throw err;
    }
  }

  /**
   * Get saved posts
   */
  async getSavedPosts(): Promise<CommunityPost[]> {
    try {
      const response = await APIClient.get<CommunityPost[]>(
        `${ENDPOINTS.COMMUNITY.POSTS}?saved=true`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get saved posts', err);
      return [];
    }
  }

  /**
   * Check if post is saved
   */
  async isPostSaved(postId: string): Promise<boolean> {
    try {
      const response = await APIClient.get<{ saved: boolean }>(
        `${ENDPOINTS.COMMUNITY.POST(postId)}/saved`
      );
      return response.data.saved;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to check if post is saved', err, { postId });
      return false;
    }
  }

  /**
   * Follow a user
   */
  async followUser(targetId: string, targetName: string): Promise<Follow> {
    try {
      const response = await APIClient.post<Follow>(`/api/v1/community/follow`, {
        targetId,
        targetName,
      });
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to follow user', err, { targetId });
      throw err;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(targetId: string): Promise<void> {
    try {
      await APIClient.delete(`/api/v1/community/follow/${targetId}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to unfollow user', err, { targetId });
      throw err;
    }
  }

  /**
   * Check if following a user/tag
   */
  async isFollowing(targetId: string, type: 'user' | 'tag' | 'breed' = 'user'): Promise<boolean> {
    try {
      const response = await APIClient.get<{ following: boolean }>(
        `/api/v1/community/follow/${targetId}?type=${type}`
      );
      return response.data.following;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to check following status', err, { targetId, type });
      return false;
    }
  }

  /**
   * Get trending tags
   */
  async getTrendingTags(period: 'day' | 'week' | 'month' = 'day'): Promise<string[]> {
    try {
      const response = await APIClient.get<string[]>(
        `/api/v1/community/trending/tags?period=${period}`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get trending tags', err, { period });
      return [];
    }
  }

  /**
   * Report content
   */
  async reportContent(
    targetType: 'post' | 'comment' | 'user',
    targetId: string,
    request: ReportContentRequest
  ): Promise<Report> {
    try {
      const response = await APIClient.post<Report>(`/api/v1/community/report`, {
        targetType,
        targetId,
        ...request,
      });
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to report content', err, { targetType, targetId });
      throw err;
    }
  }

  /**
   * Save draft
   */
  async saveDraft(draft: Partial<PostDraft>): Promise<PostDraft> {
    try {
      const response = await APIClient.post<PostDraft>(`/api/v1/community/drafts`, draft);
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to save draft', err);
      throw err;
    }
  }

  /**
   * Get drafts
   */
  async getDrafts(): Promise<PostDraft[]> {
    try {
      const response = await APIClient.get<PostDraft[]>(`/api/v1/community/drafts`);
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get drafts', err);
      return [];
    }
  }

  /**
   * Delete draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    try {
      await APIClient.delete(`/api/v1/community/drafts/${draftId}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete draft', err, { draftId });
      throw err;
    }
  }

  /**
   * Get notifications
   */
  async getNotifications(): Promise<CommunityNotification[]> {
    try {
      const response = await APIClient.get<CommunityNotification[]>(
        `/api/v1/community/notifications`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get notifications', err);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await APIClient.post(`/api/v1/community/notifications/${notificationId}/read`, {});
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to mark notification as read', err, { notificationId });
      throw err;
    }
  }
}

export const communityApi = new CommunityApiImpl();
