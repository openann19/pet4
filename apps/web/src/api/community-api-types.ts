import type { PostStatus } from '@/core/domain/community';
import type {
  Comment,
  CreateCommentData,
  CreatePostData,
  Post,
  ReactionEmoji,
  ReportData,
} from '@/lib/community-types';
import type { Report } from '@/lib/contracts';

export interface CreatePostRequest extends CreatePostData {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  status?: PostStatus; // Optional - defaults to pending_review on backend
}

export interface CreatePostResponse {
  post: Post;
}

export interface QueryFeedResponse {
  posts: Post[];
  nextCursor?: string;
  total: number;
}

export interface ToggleReactionRequest {
  userId: string;
  userName: string;
  userAvatar?: string;
  emoji: ReactionEmoji;
}

export interface ToggleReactionResponse {
  added: boolean;
  reactionsCount: number;
}

export interface CreateCommentRequest extends CreateCommentData {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

export interface CreateCommentResponse {
  comment: Comment;
}

export interface GetCommentsResponse {
  comments: Comment[];
}

export interface ReportContentRequest extends ReportData {
  reporterId: string;
}

export interface AppealModerationRequest {
  resourceId: string;
  resourceType: 'post' | 'comment' | 'user';
  userId: string;
  userName: string;
  appealText: string;
  reportId?: string;
}

export interface GetReportsResponse {
  reports: Report[];
}

