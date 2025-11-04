import { generateULID } from './utils'
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
  ReportReason
} from './community-types'
import {
  safeParseCommunityPosts,
  safeParseComments,
  safeParseReactions,
  isSavedPostArray,
  isFollowArray,
  isReportArray,
  isPostDraftArray
} from './type-guards'

const POSTS_KEY = 'community:posts'
const COMMENTS_KEY = 'community:comments'
const REACTIONS_KEY = 'community:reactions'
const SAVES_KEY = 'community:saves'
const FOLLOWS_KEY = 'community:follows'
const REPORTS_KEY = 'community:reports'
const DRAFTS_KEY = 'community:drafts'
const NOTIFICATIONS_KEY = 'community:notifications'

export const communityService = {
  async getFeed(options: FeedOptions): Promise<FeedResponse> {
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    const followsData = await spark.kv.get<unknown>(FOLLOWS_KEY)
    const follows = isFollowArray(followsData) ? followsData : []
    const userId = (await spark.user()).id
    
    let filteredPosts = posts.filter(p => p.status === 'active')
    
    if (options.mode === 'following') {
      const followedUserIds = follows
        .filter(f => f.followerId === userId && f.type === 'user')
        .map(f => f.targetId)
      const followedTags = follows
        .filter(f => f.followerId === userId && f.type === 'tag')
        .map(f => f.targetId)
      
      filteredPosts = filteredPosts.filter(post => {
        const tags = Array.isArray(post.tags) ? post.tags : []
        return followedUserIds.includes(post.authorId) ||
          tags.some(tag => followedTags.includes(tag))
      })
    } else {
      const lat = options.lat
      const lng = options.lng
      filteredPosts = await rankFeedPosts(filteredPosts, userId, lat, lng)
    }
    
    const limit = options.limit ?? 20
    const cursorIndex = options.cursor ? parseInt(options.cursor, 10) : 0
    const paginatedPosts = filteredPosts.slice(cursorIndex, cursorIndex + limit)
    const hasMore = cursorIndex + limit < filteredPosts.length
    
    return {
      posts: paginatedPosts,
      nextCursor: hasMore ? String(cursorIndex + limit) : undefined,
      hasMore
    }
  },

  async createPost(postData: Partial<CommunityPost>): Promise<CommunityPost> {
    const user = await spark.user()
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    
    const postId = generateULID()
    const newPost: CommunityPost = {
      id: postId,
      _id: postId,
      authorId: user.id,
      authorName: user.login,
      authorAvatar: user.avatarUrl,
      kind: postData.kind || 'photo',
      petIds: postData.petIds || [],
      text: postData.text || '',
      media: postData.media || [],
      location: postData.location,
      tags: postData.tags || [],
      visibility: postData.visibility || 'public',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: {
        likes: 0,
        comments: 0,
        saves: 0,
        shares: 0,
        impressions: 0
      },
      status: 'active',
      moderation: {
        state: 'approved',
        reasons: []
      },
      viewsCount: 0,
      reactionsCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      featured: false
    }
    
    posts.unshift(newPost)
    await spark.kv.set(POSTS_KEY, posts)
    
    return newPost
  },

  async getPost(postId: string): Promise<CommunityPost | undefined> {
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    const post = posts.find(p => p._id === postId || p.id === postId)
    
    if (post && post.metrics) {
      post.metrics.impressions++
      if (post.viewsCount !== undefined) post.viewsCount++
      await spark.kv.set(POSTS_KEY, posts)
    }
    
    return post
  },

  async deletePost(postId: string): Promise<void> {
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    const user = await spark.user()
    const post = posts.find(p => p._id === postId)
    
    if (post && (post.authorId === user.id || user.isOwner)) {
      post.status = 'archived'
      post.updatedAt = new Date().toISOString()
      await spark.kv.set(POSTS_KEY, posts)
    }
  },

  async likePost(postId: string): Promise<Reaction> {
    const user = await spark.user()
    const reactions = safeParseReactions(await spark.kv.get<unknown>(REACTIONS_KEY))
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    
    const existing = reactions.find(r => r.postId === postId && r.userId === user.id)
    if (existing) {
      return existing
    }
    
    const newReaction: Reaction = {
      id: generateULID(),
      _id: generateULID(),
      postId,
      userId: user.id,
      userName: user.login,
      userAvatar: user.avatarUrl,
      emoji: '❤️',
      createdAt: new Date().toISOString()
    }
    
    reactions.push(newReaction)
    await spark.kv.set(REACTIONS_KEY, reactions)
    
    const post = posts.find(p => p._id === postId || p.id === postId)
    if (post && post.metrics) {
      post.metrics.likes++
      if (post.reactionsCount !== undefined) post.reactionsCount++
      await spark.kv.set(POSTS_KEY, posts)
      
      if (post.authorId !== user.id) {
        await this.createNotification({
          type: 'like',
          actorId: user.id,
          actorName: user.login,
          actorAvatar: user.avatarUrl,
          targetId: postId,
          targetType: 'post',
          receiverId: post.authorId
        })
      }
    }
    
    return newReaction
  },

  async unlikePost(postId: string): Promise<void> {
    const user = await spark.user()
    const reactions = safeParseReactions(await spark.kv.get<unknown>(REACTIONS_KEY))
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    
    const index = reactions.findIndex(r => r.postId === postId && r.userId === user.id)
    if (index !== -1) {
      reactions.splice(index, 1)
      await spark.kv.set(REACTIONS_KEY, reactions)
      
      const post = posts.find(p => p._id === postId || p.id === postId)
      if (post && post.metrics && post.metrics.likes > 0) {
        post.metrics.likes--
        if (post.reactionsCount !== undefined && post.reactionsCount > 0) post.reactionsCount--
        await spark.kv.set(POSTS_KEY, posts)
      }
    }
  },

  async getPostLikes(postId: string): Promise<Reaction[]> {
    const reactions = safeParseReactions(await spark.kv.get<unknown>(REACTIONS_KEY))
    return reactions.filter(r => r.postId === postId)
  },

  async isPostLiked(postId: string): Promise<boolean> {
    const user = await spark.user()
    const reactions = safeParseReactions(await spark.kv.get<unknown>(REACTIONS_KEY))
    return reactions.some(r => r.postId === postId && r.userId === user.id)
  },

  async getComments(postId: string, _cursor?: string): Promise<Comment[]> {
    const comments = safeParseComments(await spark.kv.get<unknown>(COMMENTS_KEY))
    const postComments = comments
      .filter(c => c.postId === postId && c.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return postComments
  },

  async addComment(postId: string, commentData: { text: string; parentId?: string }): Promise<Comment> {
    const user = await spark.user()
    const comments = safeParseComments(await spark.kv.get<unknown>(COMMENTS_KEY))
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    
    const newComment: Comment = {
      id: generateULID(),
      _id: generateULID(),
      postId,
      authorId: user.id,
      authorName: user.login,
      authorAvatar: user.avatarUrl,
      text: commentData.text,
      parentId: commentData.parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      metrics: {
        viewsCount: 0,
        reactionsCount: 0,
        repliesCount: 0
      },
      reactionsCount: 0
    }
    
    comments.push(newComment)
    await spark.kv.set(COMMENTS_KEY, comments)
    
    const post = posts.find(p => p._id === postId || p.id === postId)
    if (post && post.metrics) {
      post.metrics.comments++
      if (post.commentsCount !== undefined) post.commentsCount++
      await spark.kv.set(POSTS_KEY, posts)
      
      if (post.authorId !== user.id) {
        await this.createNotification({
          type: commentData.parentId ? 'reply' : 'comment',
          actorId: user.id,
          actorName: user.login,
          actorAvatar: user.avatarUrl,
          targetId: postId,
          targetType: 'post',
          content: commentData.text.slice(0, 100),
          receiverId: post.authorId
        })
      }
    }
    
    return newComment
  },

  async savePost(postId: string): Promise<SavedPost> {
    const user = await spark.user()
    const savesData = await spark.kv.get<unknown>(SAVES_KEY)
    const saves = isSavedPostArray(savesData) ? savesData : []
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    
    const existing = saves.find(s => s.postId === postId && s.userId === user.id)
    if (existing) {
      return existing
    }
    
    const newSave: SavedPost = {
      _id: generateULID(),
      postId,
      userId: user.id,
      createdAt: new Date().toISOString()
    }
    
    saves.push(newSave)
    await spark.kv.set(SAVES_KEY, saves)
    
    const post = posts.find(p => p._id === postId || p.id === postId)
    if (post && post.metrics) {
      post.metrics.saves++
      await spark.kv.set(POSTS_KEY, posts)
    }
    
    return newSave
  },

  async unsavePost(postId: string): Promise<void> {
    const user = await spark.user()
    const savesData = await spark.kv.get<unknown>(SAVES_KEY)
    const saves = isSavedPostArray(savesData) ? savesData : []
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    
    const index = saves.findIndex(s => s.postId === postId && s.userId === user.id)
    if (index !== -1) {
      saves.splice(index, 1)
      await spark.kv.set(SAVES_KEY, saves)
      
      const post = posts.find(p => p._id === postId || p.id === postId)
      if (post && post.metrics && post.metrics.saves > 0) {
        post.metrics.saves--
        await spark.kv.set(POSTS_KEY, posts)
      }
    }
  },

  async getSavedPosts(): Promise<CommunityPost[]> {
    const user = await spark.user()
    const savesData = await spark.kv.get<unknown>(SAVES_KEY)
    const saves = isSavedPostArray(savesData) ? savesData : []
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    
    const userSaves = saves.filter(s => s.userId === user.id)
    const savedPosts = userSaves
      .map(save => posts.find(p => p._id === save.postId || p.id === save.postId))
      .filter((p): p is CommunityPost => p !== undefined)
      .filter(Boolean)
    
    return savedPosts
  },

  async isPostSaved(postId: string): Promise<boolean> {
    const user = await spark.user()
    const savesData = await spark.kv.get<unknown>(SAVES_KEY)
    const saves = isSavedPostArray(savesData) ? savesData : []
    return saves.some(s => s.postId === postId && s.userId === user.id)
  },

  async followUser(targetId: string, targetName: string): Promise<Follow> {
    const user = await spark.user()
    const followsData = await spark.kv.get<unknown>(FOLLOWS_KEY)
    const follows = isFollowArray(followsData) ? followsData : []
    
    const existing = follows.find(f => 
      f.followerId === user.id && f.targetId === targetId && f.type === 'user'
    )
    if (existing) {
      return existing
    }
    
    const newFollow: Follow = {
      _id: generateULID(),
      followerId: user.id,
      targetId,
      targetName,
      type: 'user',
      createdAt: new Date().toISOString()
    }
    
    follows.push(newFollow)
    await spark.kv.set(FOLLOWS_KEY, follows)
    
    await this.createNotification({
      type: 'follow',
      actorId: user.id,
      actorName: user.login,
      actorAvatar: user.avatarUrl,
      targetId: targetId,
      targetType: 'user',
      receiverId: targetId
    })
    
    return newFollow
  },

  async unfollowUser(targetId: string): Promise<void> {
    const user = await spark.user()
    const followsData = await spark.kv.get<unknown>(FOLLOWS_KEY)
    const follows = isFollowArray(followsData) ? followsData : []
    
    const index = follows.findIndex(f => 
      f.followerId === user.id && f.targetId === targetId && f.type === 'user'
    )
    if (index !== -1) {
      follows.splice(index, 1)
      await spark.kv.set(FOLLOWS_KEY, follows)
    }
  },

  async isFollowing(targetId: string, type: 'user' | 'tag' | 'breed' = 'user'): Promise<boolean> {
    const user = await spark.user()
    const followsData = await spark.kv.get<unknown>(FOLLOWS_KEY)
    const follows = isFollowArray(followsData) ? followsData : []
    return follows.some(f => f.followerId === user.id && f.targetId === targetId && f.type === type)
  },

  async getTrendingTags(period: 'day' | 'week' | 'month' = 'day'): Promise<string[]> {
    const posts = safeParseCommunityPosts(await spark.kv.get<unknown>(POSTS_KEY))
    
    const periodMs = period === 'day' ? 24 * 60 * 60 * 1000 
      : period === 'week' ? 7 * 24 * 60 * 60 * 1000 
      : 30 * 24 * 60 * 60 * 1000
    
    const recentPosts = posts.filter(p => {
      const cutoff = Date.now() - periodMs
      return new Date(p.createdAt).getTime() > cutoff && p.status === 'active'
    })
    
    const tagCounts: Record<string, number> = {}
    recentPosts.forEach(post => {
      const tags = Array.isArray(post.tags) ? post.tags : []
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 20)
  },

  async reportContent(
    targetType: 'post' | 'comment' | 'user',
    targetId: string,
    reasons: ReportReason[],
    description?: string
  ): Promise<Report> {
    const user = await spark.user()
    const reportsData = await spark.kv.get<unknown>(REPORTS_KEY)
    const reports = isReportArray(reportsData) ? reportsData : []
    
    const newReport: Report = {
      id: generateULID(),
      _id: generateULID(),
      targetType,
      targetId,
      reporterId: user.id,
      reporterName: user.login,
      reasons,
      description,
      createdAt: new Date().toISOString(),
      state: 'pending'
    }
    
    reports.push(newReport)
    await spark.kv.set(REPORTS_KEY, reports)
    
    return newReport
  },

  async saveDraft(draft: Partial<PostDraft>): Promise<PostDraft> {
    const draftsData = await spark.kv.get<unknown>(DRAFTS_KEY)
    const drafts = isPostDraftArray(draftsData) ? draftsData : []
    
    const existingIndex = drafts.findIndex(d => d.id === draft.id)
    
    const existingDraft = existingIndex !== -1 ? drafts[existingIndex] : undefined
    
    const updatedDraft: PostDraft = {
      id: draft.id || generateULID(),
      text: draft.text || '',
      media: draft.media || [],
      video: draft.video,
      petIds: draft.petIds || [],
      location: draft.location,
      tags: draft.tags || [],
      visibility: draft.visibility || 'public',
      createdAt: existingDraft?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (existingIndex !== -1) {
      drafts[existingIndex] = updatedDraft
    } else {
      drafts.push(updatedDraft)
    }
    
    await spark.kv.set(DRAFTS_KEY, drafts)
    return updatedDraft
  },

  async getDrafts(): Promise<PostDraft[]> {
    const draftsData = await spark.kv.get<unknown>(DRAFTS_KEY)
    return isPostDraftArray(draftsData) ? draftsData : []
  },

  async deleteDraft(draftId: string): Promise<void> {
    const draftsData = await spark.kv.get<unknown>(DRAFTS_KEY)
    const drafts = isPostDraftArray(draftsData) ? draftsData : []
    const filtered = drafts.filter(d => d.id !== draftId)
    await spark.kv.set(DRAFTS_KEY, filtered)
  },

  async createNotification(data: Partial<CommunityNotification> & { receiverId: string }): Promise<void> {
    const notificationsData = await spark.kv.get<unknown>(NOTIFICATIONS_KEY)
    const notifications: Record<string, CommunityNotification[]> = typeof notificationsData === 'object' && notificationsData !== null ? notificationsData as Record<string, CommunityNotification[]> : {}
    
    const newNotification: CommunityNotification = {
      id: generateULID(),
      type: data.type!,
      actorId: data.actorId!,
      actorName: data.actorName!,
      actorAvatar: data.actorAvatar,
      targetId: data.targetId!,
      targetType: data.targetType!,
      content: data.content,
      createdAt: new Date().toISOString(),
      read: false
    }
    
    if (!notifications[data.receiverId]) {
      notifications[data.receiverId] = []
    }
    
    const receiverNotifications = notifications[data.receiverId]
    if (receiverNotifications) {
      receiverNotifications.unshift(newNotification)
    }
    await spark.kv.set(NOTIFICATIONS_KEY, notifications)
  },

  async getNotifications(): Promise<CommunityNotification[]> {
    const user = await spark.user()
    const notificationsData = await spark.kv.get<unknown>(NOTIFICATIONS_KEY)
    const notifications: Record<string, CommunityNotification[]> = typeof notificationsData === 'object' && notificationsData !== null ? notificationsData as Record<string, CommunityNotification[]> : {}
    return notifications[user.id] || []
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    const user = await spark.user()
    const notificationsData = await spark.kv.get<unknown>(NOTIFICATIONS_KEY)
    const notifications: Record<string, CommunityNotification[]> = typeof notificationsData === 'object' && notificationsData !== null ? notificationsData as Record<string, CommunityNotification[]> : {}
    const userNotifications = notifications[user.id] || []
    
    const notification = userNotifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      await spark.kv.set(NOTIFICATIONS_KEY, notifications)
    }
  }
}

async function rankFeedPosts(
  posts: CommunityPost[],
  _userId: string,
  lat?: number,
  lng?: number
): Promise<CommunityPost[]> {
  const now = Date.now()
  
  const scoredPosts = posts.map(post => {
    let score = 0
    
    const ageMs = now - new Date(post.createdAt).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    const freshnessScore = Math.exp(-ageDays / 7) * 100
    score += freshnessScore * 0.3
    
    const engagementScore = post.metrics ? (
      post.metrics.likes * 2 +
      post.metrics.comments * 3 +
      post.metrics.saves * 4 +
      post.metrics.shares * 5
    ) / Math.max(1, post.metrics.impressions) : 0
    score += engagementScore * 100 * 0.4
    
    if (lat && lng && post.location && post.location.lat && (post.location.lon || post.location.lng)) {
      const lon = post.location.lon ?? post.location.lng ?? 0
      const distance = calculateDistance(lat, lng, post.location.lat, lon)
      if (distance < 50) {
        score += (1 - distance / 50) * 50 * 0.2
      }
    }
    
    score += Math.random() * 20 * 0.1
    
    return { post, score }
  })
  
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .map(item => item.post)
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
