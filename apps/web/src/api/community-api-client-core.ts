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
} from '@/lib/community-types';
import { createLogger } from '@/lib/logger';
import type {
  AddCommentRequest,
  CreatePostRequest,
  ReportContentRequest,
} from './community-api-client-types';
import { CommunityClientInteractionsApi } from './community-client/community-client-interactions-api';
import { CommunityClientOtherApi } from './community-client/community-client-other-api';
import { CommunityClientPostsApi } from './community-client/community-client-posts-api';
import { CommunityClientSocialApi } from './community-client/community-client-social-api';

const _logger = createLogger('CommunityApi');

/**
 * Community API Implementation
 * Composes specialized API modules for posts, interactions, social features, and other features
 */
export class CommunityApiImpl {
  private postsApi: CommunityClientPostsApi;
  private interactionsApi: CommunityClientInteractionsApi;
  private socialApi: CommunityClientSocialApi;
  private otherApi: CommunityClientOtherApi;

  constructor() {
    this.postsApi = new CommunityClientPostsApi();
    this.interactionsApi = new CommunityClientInteractionsApi();
    this.socialApi = new CommunityClientSocialApi();
    this.otherApi = new CommunityClientOtherApi();
  }

  async getFeed(options: FeedOptions): Promise<FeedResponse> {
    return this.postsApi.getFeed(options);
  }

  async createPost(request: CreatePostRequest): Promise<CommunityPost> {
    return this.postsApi.createPost(request);
  }

  async getPost(postId: string): Promise<CommunityPost | null> {
    return this.postsApi.getPost(postId);
  }

  async deletePost(postId: string): Promise<void> {
    return this.postsApi.deletePost(postId);
  }

  async likePost(postId: string): Promise<Reaction> {
    return this.interactionsApi.likePost(postId);
  }

  async unlikePost(postId: string): Promise<void> {
    return this.interactionsApi.unlikePost(postId);
  }

  async getPostLikes(postId: string): Promise<Reaction[]> {
    return this.interactionsApi.getPostLikes(postId);
  }

  async isPostLiked(postId: string): Promise<boolean> {
    return this.interactionsApi.isPostLiked(postId);
  }

  async getComments(postId: string, cursor?: string): Promise<Comment[]> {
    return this.interactionsApi.getComments(postId, cursor);
  }

  async addComment(postId: string, request: AddCommentRequest): Promise<Comment> {
    return this.interactionsApi.addComment(postId, request);
  }

  async savePost(postId: string): Promise<SavedPost> {
    return this.socialApi.savePost(postId);
  }

  async unsavePost(postId: string): Promise<void> {
    return this.socialApi.unsavePost(postId);
  }

  async getSavedPosts(): Promise<CommunityPost[]> {
    return this.socialApi.getSavedPosts();
  }

  async isPostSaved(postId: string): Promise<boolean> {
    return this.socialApi.isPostSaved(postId);
  }

  async followUser(targetId: string, targetName: string): Promise<Follow> {
    return this.socialApi.followUser(targetId, targetName);
  }

  async unfollowUser(targetId: string): Promise<void> {
    return this.socialApi.unfollowUser(targetId);
  }

  async isFollowing(targetId: string, type: 'user' | 'tag' | 'breed' = 'user'): Promise<boolean> {
    return this.socialApi.isFollowing(targetId, type);
  }

  async getTrendingTags(period: 'day' | 'week' | 'month' = 'day'): Promise<string[]> {
    return this.otherApi.getTrendingTags(period);
  }

  async reportContent(postId: string, request: ReportContentRequest): Promise<Report>;
  async reportContent(
    targetType: 'post' | 'comment' | 'user',
    targetId: string,
    request: ReportContentRequest
  ): Promise<Report>;
  async reportContent(
    postIdOrTargetType: string,
    targetIdOrRequest: string | ReportContentRequest,
    maybeRequest?: ReportContentRequest
  ): Promise<Report> {
    if (typeof targetIdOrRequest === 'string' && maybeRequest) {
      const postId = targetIdOrRequest;
      const request = maybeRequest;
      return this.otherApi.reportContent(postId, request);
    }

    const postId = postIdOrTargetType;
    const request = targetIdOrRequest as ReportContentRequest;
    return this.otherApi.reportContent(postId, request);
  }

  async saveDraft(draft: Partial<PostDraft>): Promise<PostDraft> {
    return this.otherApi.saveDraft(draft);
  }

  async getDrafts(): Promise<PostDraft[]> {
    return this.otherApi.getDrafts();
  }

  async deleteDraft(draftId: string): Promise<void> {
    return this.otherApi.deleteDraft(draftId);
  }

  async getNotifications(): Promise<CommunityNotification[]> {
    return this.otherApi.getNotifications();
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    return this.otherApi.markNotificationRead(notificationId);
  }
}
