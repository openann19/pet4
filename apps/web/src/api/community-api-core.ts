import type { PostStatus } from '@/core/domain/community';
import { isValidPostStatusTransition } from '@/core/domain/community';
import type {
  Comment,
  CreateCommentData,
  CreatePostData,
  Post,
  PostFilters,
  ReactionEmoji,
  ReportData,
} from '@/lib/community-types';
import type { Report } from '@/lib/contracts';
import { normalizeError } from '@/lib/error-utils';
import { createLogger } from '@/lib/logger';
import { CommunityCommentsApi } from './community/community-comments-api';
import { CommunityModerationApi } from './community/community-moderation-api';
import { CommunityPostsApi } from './community/community-posts-api';
import { CommunityReactionsApi } from './community/community-reactions-api';

const logger = createLogger('CommunityAPI');

/**
 * Community Feed API Service
 * Composes specialized API modules for posts, comments, reactions, and moderation
 */
export class CommunityAPI {
  private postsApi: CommunityPostsApi;
  private commentsApi: CommunityCommentsApi;
  private reactionsApi: CommunityReactionsApi;
  private moderationApi: CommunityModerationApi;

  constructor() {
    this.postsApi = new CommunityPostsApi();
    this.commentsApi = new CommunityCommentsApi();
    this.reactionsApi = new CommunityReactionsApi();
    this.moderationApi = new CommunityModerationApi();
  }

  async createPost(
    data: CreatePostData & {
      authorId: string;
      authorName: string;
      authorAvatar?: string;
    }
  ): Promise<Post> {
    return this.postsApi.createPost(
      data,
      data.authorId,
      data.authorName,
      data.authorAvatar
    );
  }

  async queryFeed(
    filters?: PostFilters,
    userId?: string
  ): Promise<{ posts: Post[]; nextCursor?: string; total: number }> {
    return this.postsApi.queryFeed(filters, userId);
  }

  async getPostById(id: string): Promise<Post | null> {
    return this.postsApi.getPostById(id);
  }

  async getPost(id: string): Promise<Post | null> {
    return this.postsApi.getPost(id);
  }

  async getFeed(options?: { mode?: string; lat?: number; lng?: number }): Promise<{
    posts: Post[];
    nextCursor?: string;
    total: number;
  }> {
    return this.postsApi.getFeed(options);
  }

  async getAllPosts(): Promise<Post[]> {
    return this.postsApi.getAllPosts();
  }

  async getContentFingerprints(): Promise<string[]> {
    return this.postsApi.getContentFingerprints();
  }

  async toggleReaction(
    postId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    emoji: ReactionEmoji
  ): Promise<{ added: boolean; reactionsCount: number }> {
    return this.reactionsApi.toggleReaction(postId, userId, userName, userAvatar, emoji);
  }

  async createComment(
    data: CreateCommentData & {
      authorId: string;
      authorName: string;
      authorAvatar?: string;
    }
  ): Promise<Comment> {
    return this.commentsApi.createComment(data, (id) => this.getPostById(id));
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    return this.commentsApi.getPostComments(postId);
  }

  async reportContent(data: ReportData & { reporterId: string }): Promise<void> {
    return this.moderationApi.reportContent(data);
  }

  async appealModeration(
    resourceId: string,
    resourceType: 'post' | 'comment' | 'user',
    userId: string,
    userName: string,
    appealText: string,
    reportId?: string
  ): Promise<void> {
    return this.moderationApi.appealModeration(
      resourceId,
      resourceType,
      userId,
      userName,
      appealText,
      reportId
    );
  }

  async getReportsForModeration(filters?: {
    status?: Report['status'][];
    entityType?: Report['reportedEntityType'][];
    limit?: number;
  }): Promise<Report[]> {
    return this.moderationApi.getReportsForModeration(filters);
  }

  async getPendingPosts(): Promise<Post[]> {
    return this.postsApi.getPendingPosts();
  }

  async updatePostStatus(
    postId: string,
    status: PostStatus,
    adminId: string,
    _reason?: string
  ): Promise<Post> {
    try {
      const currentPost = await this.getPostById(postId);
      if (!currentPost) {
        throw new Error('Post not found');
      }

      if (!isValidPostStatusTransition(currentPost.status, status)) {
        throw new Error(`Invalid status transition from ${currentPost.status} to ${status}`);
      }

      return this.postsApi.updatePostStatus(postId, status, adminId);
    } catch (_error) {
      const err = normalizeError(_error);
      logger.error('Failed to update post status', err, { postId, status, adminId });
      throw err;
    }
  }
}
