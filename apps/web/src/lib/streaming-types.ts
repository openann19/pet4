export type StreamStatus = 'idle' | 'connecting' | 'live' | 'ending' | 'ended'

export type StreamCategory = 'playdate' | 'training' | 'grooming' | 'pet_care' | 'adoption' | 'general' | 'qa' | 'other'

export interface LiveStream {
  id: string
  hostId: string
  hostName: string
  hostAvatar?: string
  title: string
  description?: string
  category: StreamCategory
  status: StreamStatus
  allowChat: boolean
  maxDuration: number
  startedAt: string
  endedAt?: string
  viewerCount: number
  peakViewerCount: number
  totalViews: number
  likesCount: number
  roomToken?: string
  recordingUrl?: string
  thumbnailUrl?: string
  tags: string[]
}

export interface StreamViewer {
  id: string
  streamId: string
  userId: string
  userName: string
  userAvatar?: string
  joinedAt: string
  leftAt?: string
  duration: number
}

export interface StreamChatMessage {
  id: string
  streamId: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  timestamp: string
  type: 'message' | 'reaction' | 'system'
}

export interface StreamReaction {
  emoji: string
  count: number
  users: string[]
}

export interface StreamReport {
  id: string
  streamId: string
  reporterId: string
  reason: 'inappropriate_content' | 'harassment' | 'spam' | 'violence' | 'other'
  description?: string
  timestamp: string
  resolved: boolean
}

export interface StreamSettings {
  enableChat: boolean
  enableReactions: boolean
  maxViewers?: number
  moderatorIds: string[]
  bannedUserIds: string[]
  slowModeSeconds?: number
  subscribersOnly: boolean
}

export interface CreateStreamData {
  title: string
  description?: string
  category: StreamCategory
  allowChat: boolean
  maxDuration: number
  tags?: string[]
}

export interface StreamStats {
  streamId: string
  viewerCount: number
  peakViewerCount: number
  totalViews: number
  averageWatchTime: number
  likesCount: number
  chatMessageCount: number
  reactionsCount: number
}
