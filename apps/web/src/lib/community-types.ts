/**
 * Community Feed Data Models
 * As specified in the feature pack
 */

export type PostKind = 'text' | 'photo' | 'video' | 'event'
export type PostVisibility = 'public' | 'matches' | 'followers' | 'private'
export type PostStatus = 'active' | 'pending_review' | 'rejected' | 'archived'
export type CommentStatus = 'active' | 'deleted' | 'hidden'
export type ReactionEmoji = '❤️' | '👍' | '👏' | '🔥' | '😊' | '🎉' | '💯'

export interface Post {
  id: string
  _id?: string // Alias for compatibility
  authorId: string
  authorName: string
  authorAvatar?: string
  kind: PostKind
  text?: string
  media?: string[] | PostMedia[] // Photo/video URLs or media objects
  petIds?: string[] // Pet IDs associated with the post
  tags?: string[]
  location?: {
    city?: string
    country?: string
    lat?: number
    lon?: number
    lng?: number // Alias for lon
    privacyRadiusM?: number
    placeId?: string
    placeName?: string
  }
  visibility: PostVisibility
  status: PostStatus
  createdAt: string
  updatedAt: string
  publishedAt?: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  viewsCount?: number
  reactionsCount?: number
  commentsCount?: number
  sharesCount?: number
  featured?: boolean
  nsfwScore?: number // 0-1, pre-upload filter
  contentFingerprint?: string // For duplicate detection
  metrics?: PostMetrics
  moderation?: PostModeration
}

export interface Comment {
  id: string
  _id?: string // Alias for compatibility
  postId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  text: string
  status: CommentStatus
  createdAt: string
  updatedAt: string
  deletedAt?: string
  parentCommentId?: string // For threaded comments
  parentId?: string // Alias for compatibility
  reactionsCount: number
  nsfwScore?: number
  metrics?: {
    viewsCount?: number
    reactionsCount?: number
    repliesCount?: number
  }
}

export interface Reaction {
  id: string
  _id?: string // Alias for compatibility
  postId: string
  userId: string
  userName: string
  userAvatar?: string
  emoji: ReactionEmoji
  createdAt: string
}

export interface CommentReaction {
  id: string
  commentId: string
  userId: string
  emoji: ReactionEmoji
  createdAt: string
}

export interface PostFilters {
  kind?: PostKind[]
  authorId?: string
  tags?: string[]
  location?: {
    lat: number
    lon: number
    radiusKm: number
  }
  visibility?: PostVisibility[]
  featured?: boolean
  sortBy?: 'recent' | 'popular' | 'trending'
  cursor?: string
  limit?: number
}

export interface CreatePostData {
  kind: PostKind
  text?: string
  media?: string[]
  tags?: string[]
  location?: {
    city: string
    country: string
    lat?: number
    lon?: number
    privacyRadiusM?: number
  }
  visibility: PostVisibility
}

export interface CreateCommentData {
  postId: string
  text: string
  parentCommentId?: string
}

export interface ReportData {
  resourceType: 'post' | 'comment' | 'user'
  resourceId: string
  reason: string
  details?: string
}

// Alias for compatibility
export type CommunityPost = Post

// Media types
export interface PostMedia {
  id: string
  url: string
  thumbnail?: string
  type: 'photo' | 'video'
  width?: number
  height?: number
  duration?: number
}

export interface PostVideo extends PostMedia {
  type: 'video'
  duration: number
  thumbnail: string
}

// Additional types for community features
export interface PostLocation {
  lat: number
  lng: number
  placeId: string
  placeName: string
}

export interface PostMetrics {
  likes: number
  comments: number
  saves: number
  shares: number
  impressions: number
}

export interface PostModeration {
  state: 'pending' | 'auto-flagged' | 'approved' | 'rejected'
  reasons: string[]
}

export interface SavedPost {
  _id: string
  postId: string
  userId: string
  createdAt: string
}

export interface Follow {
  _id: string
  followerId: string
  targetId: string
  targetName: string
  type: 'user' | 'tag' | 'breed'
  createdAt: string
}

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'misleading' | 'violence' | 'hate-speech' | 'copyright' | 'other'

export interface Report {
  id?: string
  _id?: string // Alias for compatibility
  targetType: 'post' | 'comment' | 'user'
  targetId: string
  reporterId: string
  reporterName: string
  reasons: ReportReason[]
  createdAt: string
  state: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  description?: string
}

export interface PostDraft {
  id: string
  text: string
  media: string[]
  video?: string
  petIds: string[]
  tags: string[]
  location?: {
    lat: number
    lng: number
    address?: string
  }
  visibility: PostVisibility
  createdAt: string
  updatedAt: string
}

export interface TrendingTag {
  tag: string
  count: number
  trending: boolean
}

export interface CommunityNotification {
  id: string
  type: 'like' | 'comment' | 'reply' | 'follow' | 'mention' | 'moderation'
  actorId: string
  actorName: string
  actorAvatar?: string
  targetId: string
  targetType: 'post' | 'comment' | 'user'
  content?: string
  createdAt: string
  read: boolean
}

export interface FeedOptions {
  mode: 'for-you' | 'following'
  lat?: number
  lng?: number
  limit?: number
  cursor?: string
}

export interface FeedResponse {
  posts: Post[]
  hasMore: boolean
  nextCursor?: string
}
