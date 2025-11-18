import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { normalizeError } from '@/lib/error-utils';
import type { CommunityPost, FeedOptions, FeedResponse } from '@/lib/community-types';
import { createLogger } from '@/lib/logger';
import type { CreatePostRequest } from '../community-api-client-types';

const logger = createLogger('CommunityClientPostsApi');

/**
 * Posts-related API methods for community client
 */
export class CommunityClientPostsApi {
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
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to get feed', err, { options });
      throw err;
    }
  }

  async createPost(request: CreatePostRequest): Promise<CommunityPost> {
    try {
      const response = await APIClient.post<{ post: CommunityPost }>(
        ENDPOINTS.COMMUNITY.POSTS,
        request
      );
      return response.data.post;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to create post', err);
      throw err;
    }
  }

  async getPost(postId: string): Promise<CommunityPost | null> {
    try {
      const response = await APIClient.get<{ post: CommunityPost }>(
        ENDPOINTS.COMMUNITY.POST(postId)
      );
      return response.data.post ?? null;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to get post', err, { postId });
      return null;
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await APIClient.delete(ENDPOINTS.COMMUNITY.POST(postId));
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to delete post', err, { postId });
      throw err;
    }
  }
}

