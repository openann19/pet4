import type { PostStatus } from '@/core/domain/community'
import { canReceiveComments, isValidPostStatusTransition } from '@/core/domain/community'
import { APIClient } from '@/lib/api-client'
import type {
    Comment,
    CreateCommentData,
    CreatePostData,
    Post,
    PostFilters,
    ReactionEmoji,
    ReportData
} from '@/lib/community-types'
import type { Report } from '@/lib/contracts'
import { ENDPOINTS } from '@/lib/endpoints'
import { createLogger } from '@/lib/logger'
import { enforceRateLimit } from '@/lib/rate-limiting'

const logger = createLogger('CommunityAPI')

export interface CreatePostRequest extends CreatePostData {
  authorId: string
  authorName: string
  authorAvatar?: string
  status?: PostStatus // Optional - defaults to pending_review on backend
}

export interface CreatePostResponse {
  post: Post
}

export interface QueryFeedResponse {
  posts: Post[]
  nextCursor?: string
  total: number
}

export interface ToggleReactionRequest {
  userId: string
  userName: string
  userAvatar?: string
  emoji: ReactionEmoji
}

export interface ToggleReactionResponse {
  added: boolean
  reactionsCount: number
}

export interface CreateCommentRequest extends CreateCommentData {
  authorId: string
  authorName: string
  authorAvatar?: string
}

export interface CreateCommentResponse {
  comment: Comment
}

export interface GetCommentsResponse {
  comments: Comment[]
}

export interface ReportContentRequest extends ReportData {
  reporterId: string
}

export interface AppealModerationRequest {
  resourceId: string
  resourceType: 'post' | 'comment' | 'user'
  userId: string
  userName: string
  appealText: string
  reportId?: string
}

export interface GetReportsResponse {
  reports: Report[]
}

/**
 * Community Feed API Service
 * Implements REST API endpoints as specified:
 * POST /community/posts
 * GET  /community/feed?cursor=...
 * POST /community/posts/:id/react
 * POST /community/posts/:id/comments
 * POST /community/posts/:id/report
 */
export class CommunityAPI {

  /**
   * POST /community/posts
   * Create a new post - all posts require manual admin approval
   */
  async createPost(
    data: CreatePostData & {
      authorId: string
      authorName: string
      authorAvatar?: string
    }
  ): Promise<Post> {
    try {
      const request: CreatePostRequest = {
        ...data,
        authorId: data.authorId,
        authorName: data.authorName,
        ...(data.authorAvatar ? { authorAvatar: data.authorAvatar } : {}),
        status: 'pending_review' as PostStatus // All posts require manual approval
      }

      const response = await APIClient.post<CreatePostResponse>(
        ENDPOINTS.COMMUNITY.CREATE_POST,
        request
      )

      const post = response.data.post

      // Ensure post is set to pending_review for manual approval
      if (post.status !== 'pending_review') {
        logger.info('Post created, awaiting admin approval', { 
          postId: post.id,
          currentStatus: post.status
        })
      } else {
        logger.info('Post created and queued for admin approval', { 
          postId: post.id
        })
      }

      return post
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create post', err, { authorId: data.authorId })
      throw err
    }
  }

  /**
   * GET /community/feed?cursor=...
   * Query posts with filters and pagination
   */
  async queryFeed(
    filters?: PostFilters,
    userId?: string
  ): Promise<{ posts: Post[]; nextCursor?: string; total: number }> {
    try {
      const queryParams: Record<string, unknown> = {}
      
      if (filters?.kind && filters.kind.length > 0) {
        queryParams['kind'] = filters.kind
      }

      if (filters?.authorId) {
        queryParams['authorId'] = filters.authorId
      }

      if (filters?.tags && filters.tags.length > 0) {
        queryParams['tags'] = filters.tags
      }

      if (filters?.location) {
        queryParams['near'] = `${filters.location.lat},${filters.location.lon}`
        queryParams['radius'] = filters.location.radiusKm
      }

      if (filters?.visibility && filters.visibility.length > 0) {
        queryParams['visibility'] = filters.visibility
      } else if (userId) {
        queryParams['visibility'] = ['public', 'matches']
      }

      if (filters?.featured) {
        queryParams['featured'] = filters.featured
      }

      if (filters?.sortBy) {
        queryParams['sortBy'] = filters.sortBy
      }

      if (filters?.cursor) {
        queryParams['cursor'] = filters.cursor
      }

      if (filters?.limit) {
        queryParams['limit'] = filters.limit
      }

      if (userId) {
        queryParams['userId'] = userId
      }

      const url = ENDPOINTS.COMMUNITY.POSTS + (Object.keys(queryParams).length > 0 
        ? '?' + new URLSearchParams(
            Object.entries(queryParams).map(([k, v]) => [k, String(v)])
          ).toString()
        : '')

      const response = await APIClient.get<QueryFeedResponse>(url)
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to query feed', err, { filters })
      throw err
    }
  }

  /**
   * GET /community/posts/:id
   */
  async getPostById(id: string): Promise<Post | null> {
    try {
      const response = await APIClient.get<{ post: Post }>(
        ENDPOINTS.COMMUNITY.POST(id)
      )
      
      const post = response.data.post
      
      // Increment view count (fire and forget)
      try {
        await APIClient.post(`${ENDPOINTS.COMMUNITY.POST(id)}/view`)
      } catch (error) {
        logger.warn('Failed to increment view count', { 
          postId: id, 
          error: error instanceof Error ? error : new Error(String(error)) 
        })
      }
      
      return post
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      // If 404, return null instead of throwing
      if (err.message.includes('404') || err.message.includes('not found')) {
        return null
      }
      logger.error('Failed to get post by ID', err, { id })
      throw err
    }
  }

  /**
   * Get all posts (public method for admin/moderation)
   */
  async getAllPosts(): Promise<Post[]> {
    try {
      const response = await this.queryFeed({ limit: 1000 })
      return response.posts
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get all posts', err)
      throw err
    }
  }

  /**
   * Get content fingerprints for duplicate detection
   */
  async getContentFingerprints(): Promise<string[]> {
    try {
      const response = await APIClient.get<{ fingerprints: string[] }>(
        '/community/posts/fingerprints'
      )
      return response.data.fingerprints
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get content fingerprints', err)
      throw err
    }
  }

  /**
   * POST /community/posts/:id/react
   * Add or remove reaction
   */
  async toggleReaction(
    postId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    emoji: ReactionEmoji
  ): Promise<{ added: boolean; reactionsCount: number }> {
    try {
      const request: ToggleReactionRequest = {
        userId,
        userName,
        ...(userAvatar !== undefined && { userAvatar }),
        emoji
      }

      const response = await APIClient.post<ToggleReactionResponse>(
        ENDPOINTS.COMMUNITY.LIKE_POST(postId),
        request
      )

      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to toggle reaction', err, { postId, userId })
      throw err
    }
  }

  /**
   * POST /community/posts/:id/comments
   * Create a comment
   */
  async createComment(
    data: CreateCommentData & {
      authorId: string
      authorName: string
      authorAvatar?: string
    }
  ): Promise<Comment> {
    try {
      // Verify post exists and can receive comments
      const post = await this.getPostById(data.postId)
      if (!post) {
        throw new Error('Post not found')
      }
      if (!canReceiveComments(post.status)) {
        throw new Error('Cannot comment on inactive post')
      }

      // Rate limit check (max 50 comments per hour)
      await enforceRateLimit(data.authorId, {
        maxRequests: 50,
        windowMs: 60 * 60 * 1000, // 1 hour
        action: 'comment'
      })

      const request: CreateCommentRequest = {
        ...data,
        authorId: data.authorId,
        authorName: data.authorName,
        ...(data.authorAvatar ? { authorAvatar: data.authorAvatar } : {})
      }

      const response = await APIClient.post<CreateCommentResponse>(
        ENDPOINTS.COMMUNITY.COMMENT(data.postId),
        request
      )

      return response.data.comment
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create comment', err, { postId: data.postId })
      throw err
    }
  }

  /**
   * GET /community/posts/:id/comments
   */
  async getPostComments(postId: string): Promise<Comment[]> {
    try {
      const response = await APIClient.get<GetCommentsResponse>(
        ENDPOINTS.COMMUNITY.COMMENT(postId)
      )
      return response.data.comments
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get post comments', err, { postId })
      throw err
    }
  }

  /**
   * POST /community/posts/:id/report
   * Report a post or comment
   */
  async reportContent(
    data: ReportData & { reporterId: string }
  ): Promise<void> {
    try {
      const request: ReportContentRequest = {
        ...data,
        reporterId: data.reporterId
      }

      await APIClient.post(
        `${ENDPOINTS.COMMUNITY.POST(data.resourceId)}/report`,
        request
      )
      
      logger.info('Content reported', {
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        reason: data.reason,
        reporterId: data.reporterId
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to report content', err, { resourceId: data.resourceId })
      throw err
    }
  }

  /**
   * POST /community/appeals
   * Appeal a moderation decision
   */
  async appealModeration(
    resourceId: string,
    resourceType: 'post' | 'comment' | 'user',
    userId: string,
    userName: string,
    appealText: string,
    reportId?: string
  ): Promise<void> {
    try {
      const request: AppealModerationRequest = {
        resourceId,
        resourceType,
        userId,
        userName,
        appealText,
        ...(reportId !== undefined && { reportId })
      }

      await APIClient.post('/community/appeals', request)

      logger.info('Appeal submitted', {
        resourceType,
        resourceId,
        userId,
        reportId
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to submit appeal', err, { resourceId, userId })
      throw err
    }
  }
  
  /**
   * Get reports for moderation queue
   */
  async getReportsForModeration(
    filters?: {
      status?: Report['status'][]
      entityType?: Report['reportedEntityType'][]
      limit?: number
    }
  ): Promise<Report[]> {
    try {
      const queryParams: Record<string, unknown> = {}
      
      if (filters?.status && filters.status.length > 0) {
        queryParams['status'] = filters.status
      }
      
      if (filters?.entityType && filters.entityType.length > 0) {
        queryParams['entityType'] = filters.entityType
      }

      if (filters?.limit) {
        queryParams['limit'] = filters.limit
      }

      const url = '/community/reports' + (Object.keys(queryParams).length > 0 
        ? '?' + new URLSearchParams(
            Object.entries(queryParams).map(([k, v]) => [k, String(v)])
          ).toString()
        : '')

      const response = await APIClient.get<GetReportsResponse>(url)
      return response.data.reports
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get reports for moderation', err, { filters })
      throw err
    }
  }

  /**
   * Admin: Get pending posts
   */
  async getPendingPosts(): Promise<Post[]> {
    try {
      const response = await this.queryFeed({ 
        // Query with status filter (need to add status param)
        limit: 1000 
      })
      // Filter pending posts client-side if backend doesn't support status filter
      return response.posts.filter(p => p.status === 'pending_review')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get pending posts', err)
      throw err
    }
  }

  /**
   * Admin: Update post status
   */
  async updatePostStatus(
    postId: string,
    status: PostStatus,
    adminId: string,
    reason?: string
  ): Promise<Post> {
    try {
      // First get the post to validate transition
      const currentPost = await this.getPostById(postId)
      if (!currentPost) {
        throw new Error('Post not found')
      }

      // Validate status transition using domain logic
      if (!isValidPostStatusTransition(currentPost.status, status)) {
        throw new Error(`Invalid status transition from ${currentPost.status} to ${status}`)
      }

      const response = await APIClient.patch<{ post: Post }>(
        ENDPOINTS.COMMUNITY.POST(postId),
        {
          status,
          adminId,
          reason
        }
      )

      return response.data.post
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update post status', err, { postId, status, adminId })
      throw err
    }
  }
}

// Singleton instance with HMR-friendly pattern
let communityAPIInstance: CommunityAPI | null = null

export function getCommunityAPI(): CommunityAPI {
  if (!communityAPIInstance) {
    communityAPIInstance = new CommunityAPI()
  }
  return communityAPIInstance
}

// Export instance for backward compatibility (HMR-safe)
export const communityAPI = getCommunityAPI()

// HMR support: reset instance on hot module replacement
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    communityAPIInstance = null
  })
}

