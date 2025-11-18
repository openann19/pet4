import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { normalizeError } from '@/lib/error-utils';
import type { CommunityPost, Follow, SavedPost } from '@/lib/community-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CommunityClientSocialApi');

/**
 * Social features API methods (saves, follows)
 */
export class CommunityClientSocialApi {
  async savePost(postId: string): Promise<SavedPost> {
    try {
      const response = await APIClient.post<{ savedPost: SavedPost }>(
        ENDPOINTS.COMMUNITY.SAVE_POST(postId),
        {}
      );
      return response.data.savedPost;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to save post', err, { postId });
      throw err;
    }
  }

  async unsavePost(postId: string): Promise<void> {
    try {
      await APIClient.delete(ENDPOINTS.COMMUNITY.SAVE_POST(postId));
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to unsave post', err, { postId });
      throw err;
    }
  }

  async getSavedPosts(): Promise<CommunityPost[]> {
    try {
      const response = await APIClient.get<{ posts: CommunityPost[] }>(
        ENDPOINTS.COMMUNITY.SAVED_POSTS
      );
      return response.data.posts;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to get saved posts', err);
      throw err;
    }
  }

  async isPostSaved(postId: string): Promise<boolean> {
    try {
      const response = await APIClient.get<{ saved: boolean }>(
        ENDPOINTS.COMMUNITY.IS_SAVED(postId)
      );
      return response.data.saved;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to check if post is saved', err, { postId });
      return false;
    }
  }

  async followUser(targetId: string, targetName: string): Promise<Follow> {
    try {
      const response = await APIClient.post<{ follow: Follow }>(
        ENDPOINTS.COMMUNITY.FOLLOW,
        { targetId, targetName }
      );
      return response.data.follow;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to follow user', err, { targetId });
      throw err;
    }
  }

  async unfollowUser(targetId: string): Promise<void> {
    try {
      await APIClient.delete(`${ENDPOINTS.COMMUNITY.FOLLOW}/${targetId}`);
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to unfollow user', err, { targetId });
      throw err;
    }
  }

  async isFollowing(
    targetId: string,
    type: 'user' | 'tag' | 'breed' = 'user'
  ): Promise<boolean> {
    try {
      const response = await APIClient.get<{ following: boolean }>(
        `${ENDPOINTS.COMMUNITY.FOLLOW}/${targetId}?type=${type}`
      );
      return response.data.following;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to check if following', err, { targetId, type });
      return false;
    }
  }
}

