/**
 * API Services Index
 * Centralized exports for all API services
 */

export { adminApi } from './admin-api';
export { adoptionApi } from './adoption-api';
export { analyticsApi } from './analytics-api';
export { apiConfigApi } from './api-config-api';
export { authApi } from './auth-api';
export { chatApi } from './chat-api';
export { communityAPI } from './community-api';
export { featureFlagsApi } from './feature-flags-api';
export { imageUploadApi } from './image-upload-api';
export { kycApi } from './kyc-api';
export { liveStreamingAPI } from './live-streaming-api';
export { llmApi } from './llm-api';
export { lostFoundAPI } from './lost-found-api';
export { matchingAPI } from './matching-api';
export { notificationsApi } from './notifications-api';
export { paymentsApi } from './payments-api';
export { photoModerationAPI as photoModerationApi } from './photo-moderation-api';
export { rateLimitingApi } from './rate-limiting-api';
export { streamingApi } from './streaming-api';
export { verificationApi } from './verification-api';

// Re-export types
export type {
  AdoptionApplication,
  AdoptionApplicationStatus,
  AdoptionListing,
  AdoptionListingFilters,
  AdoptionListingStatus,
  CreateAdoptionListingData,
} from '@/lib/adoption-marketplace-types';

export type { LostAlertStatus } from '@/core/domain/lost-found';
export type {
  CreateLostAlertData,
  CreateSightingData,
  LostAlert,
  LostAlertFilters,
  Sighting,
} from '@/lib/lost-found-types';

export type { CommentStatus, PostStatus } from '@/core/domain/community';
export type {
  Comment,
  CommentReaction,
  CreateCommentData,
  CreatePostData,
  Post,
  PostFilters,
  PostKind,
  PostVisibility,
  Reaction,
  ReactionEmoji,
  ReportData,
} from '@/lib/community-types';

export type {
  CreateLiveStreamData,
  LiveStream,
  LiveStreamCategory,
  LiveStreamChatMessage,
  LiveStreamFilters,
  LiveStreamReaction,
  LiveStreamStatus,
  LiveStreamViewer,
} from '@/lib/live-streaming-types';
