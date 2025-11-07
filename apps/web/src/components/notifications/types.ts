/**
 * Notification Types
 */

export interface PremiumNotification {
  id: string
  type: 'match' | 'message' | 'like' | 'verification' | 'story' | 'system' | 'moderation' | 'achievement' | 'social' | 'event'
  title: string
  message: string
  timestamp: number
  read: boolean
  archived: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical'
  actionUrl?: string
  actionLabel?: string
  imageUrl?: string
  avatarUrl?: string
  mediaType?: 'image' | 'video' | 'audio' | 'gif'
  groupId?: string
  metadata?: {
    petName?: string
    userName?: string
    matchId?: string
    messageId?: string
    count?: number
    compatibilityScore?: number
    reactionType?: string
    location?: string
    eventType?: string
    achievementBadge?: string
  }
}

export interface NotificationGroup {
  id: string
  type: string
  notifications: PremiumNotification[]
  title: string
  summary: string
  timestamp: number
  read: boolean
}

export interface NotificationPreferences {
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  groupSimilar: boolean
  showPreviews: boolean
  soundEnabled: boolean
  pushEnabled: boolean
}

export type NotificationFilter = 'all' | 'unread' | 'archived'
export type NotificationView = 'grouped' | 'list'
