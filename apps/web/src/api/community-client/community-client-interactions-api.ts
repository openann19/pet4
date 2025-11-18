import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { normalizeError } from '@/lib/error-utils';
import type { Comment, Reaction } from '@/lib/community-types';
import { createLogger } from '@/lib/logger';
import type { AddCommentRequest } from '../community-api-client-types';

const logger = createLogger('CommunityClientInteractionsApi');

/**
 * Interactions API methods (likes, comments)
 */
export class CommunityClientInteractionsApi {
  async likePost(postId: string): Promise<Reaction> {
    try {
      const response = await APIClient.post<{ reaction: Reaction }>(
        ENDPOINTS.COMMUNITY.LIKE_POST(postId),
        {}
      );
      return response.data.reaction;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to like post', err, { postId });
      throw err;
    }
  }

  async unlikePost(postId: string): Promise<void> {
    try {
      await APIClient.delete(ENDPOINTS.COMMUNITY.LIKE_POST(postId));
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to unlike post', err, { postId });
      throw err;
    }
  }

  async getPostLikes(postId: string): Promise<Reaction[]> {
    try {
      const response = await APIClient.get<{ reactions: Reaction[] }>(
        ENDPOINTS.COMMUNITY.LIKES(postId)
      );
      return response.data.reactions;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to get post likes', err, { postId });
      throw err;
    }
  }

  async isPostLiked(postId: string): Promise<boolean> {
    try {
      const response = await APIClient.get<{ liked: boolean }>(
        ENDPOINTS.COMMUNITY.IS_LIKED(postId)
      );
      return response.data.liked;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to check if post is liked', err, { postId });
      return false;
    }
  }

  async getComments(postId: string, cursor?: string): Promise<Comment[]> {
    try {
      const url = cursor
        ? `${ENDPOINTS.COMMUNITY.COMMENT(postId)}?cursor=${cursor}`
        : ENDPOINTS.COMMUNITY.COMMENT(postId);
      const response = await APIClient.get<{ comments: Comment[] }>(url);
      return response.data.comments;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to get comments', err, { postId });
      throw err;
    }
  }

  async addComment(postId: string, request: AddCommentRequest): Promise<Comment> {
    try {
      const response = await APIClient.post<{ comment: Comment }>(
        ENDPOINTS.COMMUNITY.COMMENT(postId),
        request
      );
      return response.data.comment;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to add comment', err, { postId });
      throw err;
    }
  }
}

