import { APIClient } from '@/lib/api-client';
import type { CreatePostData, Post, PostFilters } from '@/lib/community-types';
import { ENDPOINTS } from '@/lib/endpoints';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';
import { buildFeedQueryParams, buildFeedUrl } from '../community-api-helpers';
import type { CreatePostRequest, CreatePostResponse, QueryFeedResponse } from '../community-api-types';

const logger = createLogger('CommunityPostsApi');

/**
 * Posts-related API methods
 */
export class CommunityPostsApi {
  async createPost(
    data: CreatePostData,
    authorId: string,
    authorName: string,
    authorAvatar?: string
  ): Promise<Post> {
    try {
      const request: CreatePostRequest = {
        kind: data.kind,
        ...(data.text ? { text: data.text } : {}),
        media: Array.isArray(data.media)
          ? data.media.filter((m): m is string => typeof m === 'string')
          : [],
        ...(data.location ? { location: data.location } : {}),
        ...(data.tags ? { tags: data.tags } : {}),
        visibility: data.visibility ?? 'public',
        authorId,
        authorName,
        ...(authorAvatar ? { authorAvatar } : {}),
      };

      const response = await APIClient.post<CreatePostResponse>(
        ENDPOINTS.COMMUNITY.POSTS,
        request
      );
      return response.data.post;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to create post', err, { kind: data.kind });
      throw err;
    }
  }

  async queryFeed(
    filters?: PostFilters,
    userId?: string
  ): Promise<{ posts: Post[]; nextCursor?: string; total: number }> {
    try {
      const queryParams = buildFeedQueryParams(filters, userId);
      const url = buildFeedUrl(ENDPOINTS.COMMUNITY.POSTS, queryParams);
      const response = await APIClient.get<QueryFeedResponse>(url);
      return response.data;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to query feed', err, { filters });
      throw err;
    }
  }

  async getPostById(id: string): Promise<Post | null> {
    try {
      const response = await APIClient.get<{ post: Post }>(ENDPOINTS.COMMUNITY.POST(id));
      return response.data.post ?? null;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get post', err, { postId: id });
      return null;
    }
  }

  async getPost(id: string): Promise<Post | null> {
    return this.getPostById(id);
  }

  async getFeed(options?: { mode?: string; lat?: number; lng?: number }): Promise<{
    posts: Post[];
    nextCursor?: string;
    total: number;
  }> {
    try {
      const filters: PostFilters = {};
      if (options?.mode) {
        filters.sortBy = options.mode === 'trending' ? 'trending' : 'recent';
      }
      if (options?.lat !== undefined && options?.lng !== undefined) {
        filters.location = {
          lat: options.lat,
          lon: options.lng,
          radiusKm: 50,
        };
      }
      return this.queryFeed(filters);
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get feed', err, { options });
      throw err;
    }
  }

  async getAllPosts(): Promise<Post[]> {
    try {
      const result = await this.queryFeed();
      return result.posts;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get all posts', err);
      throw err;
    }
  }

  async getContentFingerprints(): Promise<string[]> {
    try {
      const response = await APIClient.get<{ fingerprints: string[] }>(
        '/api/v1/community/content/fingerprints'
      );
      return response.data.fingerprints;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get content fingerprints', err);
      throw err;
    }
  }

  async getPendingPosts(): Promise<Post[]> {
    try {
      const response = await APIClient.get<{ posts: Post[] }>('/api/v1/community/posts/pending');
      return response.data.posts;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to get pending posts', err);
      throw err;
    }
  }

  async updatePostStatus(
    postId: string,
    status: string,
    moderatorId: string
  ): Promise<Post> {
    try {
      const response = await APIClient.patch<{ post: Post }>(
        `/api/v1/community/posts/${postId}/status`,
        { status, moderatorId }
      );
      return response.data.post;
    } catch (error) {
      const err = normalizeError(error);
      logger.error('Failed to update post status', err, { postId, status });
      throw err;
    }
  }
}

