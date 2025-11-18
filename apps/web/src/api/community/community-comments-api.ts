import { canReceiveComments } from '@/core/domain/community';
import type { PostStatus } from '@/core/domain/community';
import { APIClient } from '@/lib/api-client';
import type { Comment, CreateCommentData } from '@/lib/community-types';
import { ENDPOINTS } from '@/lib/endpoints';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/rate-limiting';
import type {
  CreateCommentRequest,
  CreateCommentResponse,
  GetCommentsResponse,
} from '../community-api-types';

const logger = createLogger('CommunityCommentsApi');

/**
 * Comments-related API methods
 */
export class CommunityCommentsApi {
  async createComment(
    data: CreateCommentData & {
      authorId: string;
      authorName: string;
      authorAvatar?: string;
    },
    getPostById: (id: string) => Promise<{ status: PostStatus } | null>
  ): Promise<Comment> {
    try {
      const post = await getPostById(data.postId);
      if (!post) {
        throw new Error('Post not found');
      }
      if (!canReceiveComments(post.status)) {
        throw new Error('Cannot comment on inactive post');
      }

      await enforceRateLimit(data.authorId, {
        maxRequests: 50,
        windowMs: 60 * 60 * 1000,
        action: 'comment',
      });

      const request: CreateCommentRequest = {
        ...data,
        authorId: data.authorId,
        authorName: data.authorName,
        ...(data.authorAvatar ? { authorAvatar: data.authorAvatar } : {}),
      };

      const response = await APIClient.post<CreateCommentResponse>(
        ENDPOINTS.COMMUNITY.COMMENT(data.postId),
        request
      );

      return response.data.comment;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to create comment', err, { postId: data.postId });
      throw err;
    }
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    try {
      const response = await APIClient.get<GetCommentsResponse>(
        ENDPOINTS.COMMUNITY.COMMENT(postId)
      );
      return response.data.comments;
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to get post comments', err, { postId });
      throw err;
    }
  }
}

