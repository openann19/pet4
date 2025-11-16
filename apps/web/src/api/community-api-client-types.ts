import type {
  FeedOptions,
  PostKind,
  PostVisibility,
  ReportReason,
} from '@/lib/community-types';

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

