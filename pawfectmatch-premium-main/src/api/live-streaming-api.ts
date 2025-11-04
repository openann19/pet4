import type {
  LiveStream,
  LiveStreamViewer,
  LiveStreamReaction,
  LiveStreamChatMessage,
  CreateLiveStreamData,
  LiveStreamFilters
} from '@/lib/live-streaming-types'
import { generateULID } from '@/lib/utils'
import { signLiveKitToken, isTokenSigningConfigured, deleteLiveKitRoom, compositeStreamToHLS } from '@/core/services/token-signing'
import { createLogger } from '@/lib/logger'
import { realtime } from '@/lib/realtime'

const logger = createLogger('LiveStreamingAPI')

/**
 * Go Live (Streaming) API Service
 * Implements REST API endpoints as specified:
 * POST /live/createRoom           // returns join tokens
 * POST /live/endRoom
 * GET  /live/active               // discovery
 * WS   /live/:roomId/chat
 */
export class LiveStreamingAPI {
  private async getStreams(): Promise<LiveStream[]> {
    return await spark.kv.get<LiveStream[]>('live-streams') || []
  }

  private async setStreams(streams: LiveStream[]): Promise<void> {
    await spark.kv.set('live-streams', streams)
  }

  private async getViewers(): Promise<LiveStreamViewer[]> {
    return await spark.kv.get<LiveStreamViewer[]>('live-stream-viewers') || []
  }

  private async setViewers(viewers: LiveStreamViewer[]): Promise<void> {
    await spark.kv.set('live-stream-viewers', viewers)
  }

  private async getReactions(): Promise<LiveStreamReaction[]> {
    return await spark.kv.get<LiveStreamReaction[]>('live-stream-reactions') || []
  }

  private async setReactions(reactions: LiveStreamReaction[]): Promise<void> {
    await spark.kv.set('live-stream-reactions', reactions)
  }

  private async getChatMessages(): Promise<LiveStreamChatMessage[]> {
    return await spark.kv.get<LiveStreamChatMessage[]>('live-stream-chat') || []
  }

  private async setChatMessages(messages: LiveStreamChatMessage[]): Promise<void> {
    await spark.kv.set('live-stream-chat', messages)
  }

  /**
   * POST /live/createRoom
   * Create a live stream room and return join tokens
   */
  async createRoom(
    data: CreateLiveStreamData & { hostId: string; hostName: string; hostAvatar?: string }
  ): Promise<{ stream: LiveStream; joinToken: string; publishToken: string }> {
    const streams = await this.getStreams()
    
    const roomId = `live:${data.hostId}`
    
    const stream: LiveStream = {
      id: generateULID(),
      hostId: data.hostId,
      hostName: data.hostName,
      hostAvatar: data.hostAvatar,
      title: data.title,
      category: data.category,
      description: data.description,
      roomId,
      status: 'live',
      allowChat: data.allowChat,
      maxDuration: data.maxDuration,
      scheduledAt: data.scheduledAt,
      startedAt: new Date().toISOString(),
      viewerCount: 0,
      peakViewerCount: 0,
      reactionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    streams.push(stream)
    await this.setStreams(streams)

    // Sign tokens using token signing service
    // In production, this should be done server-side with proper LiveKit SDK
    const isConfigured = isTokenSigningConfigured()
    
    if (!isConfigured) {
      logger.warn('Token signing not configured - using placeholder tokens (NOT SECURE)', {
        roomId,
        hostId: data.hostId
      })
    }
    
    const joinToken = await signLiveKitToken({
      room: roomId,
      participant: `viewer_${data.hostId}`,
      permissions: {
        canPublish: false,
        canSubscribe: true,
        canPublishData: false
      }
    })
    
    const publishToken = await signLiveKitToken({
      room: roomId,
      participant: `host_${data.hostId}`,
      permissions: {
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      }
    })

    // In production, create LiveKit room via server-side API:
    // await liveKitAPI.createRoom(roomId, {
    //   maxParticipants: 100,
    //   emptyTimeout: 300,
    //   creationTime: Date.now()
    // })
    
    if (!isConfigured) {
      logger.warn('LiveKit room creation not implemented - feature disabled', {
        roomId
      })
    }

    return {
      stream,
      joinToken,
      publishToken
    }
  }

  /**
   * POST /live/endRoom
   * End a live stream
   */
  async endRoom(streamId: string, hostId: string): Promise<LiveStream> {
    const streams = await this.getStreams()
    const stream = streams.find(s => s.id === streamId)
    
    if (!stream) {
      throw new Error('Stream not found')
    }

    // Only host can end stream
    if (stream.hostId !== hostId) {
      throw new Error('Unauthorized: Only host can end stream')
    }

    if (stream.status !== 'live') {
      throw new Error('Stream is not live')
    }

    stream.status = 'ended'
    stream.endedAt = new Date().toISOString()
    stream.updatedAt = new Date().toISOString()

    // Server-side composite to HLS and store VOD
    try {
      const vodResult = await compositeStreamToHLS(stream.roomId)
      if (vodResult) {
        stream.vodUrl = vodResult.vodUrl
        stream.posterUrl = vodResult.posterUrl
        logger.info('VOD recording completed', {
          streamId: stream.id,
          vodUrl: vodResult.vodUrl
        })
      }
    } catch (error) {
      logger.error('Failed to create VOD recording', error instanceof Error ? error : new Error(String(error)), {
        streamId: stream.id,
        roomId: stream.roomId
      })
      // Don't fail stream ending if VOD recording fails
    }

    await this.setStreams(streams)

    // Close LiveKit room
    try {
      await deleteLiveKitRoom(stream.roomId)
      logger.info('LiveKit room closed', {
        streamId: stream.id,
        roomId: stream.roomId
      })
    } catch (error) {
      logger.error('Failed to close LiveKit room', error instanceof Error ? error : new Error(String(error)), {
        streamId: stream.id,
        roomId: stream.roomId
      })
      // Don't fail stream ending if room deletion fails
    }

    return stream
  }

  /**
   * GET /live/active
   * Discovery of active streams
   */
  async queryActiveStreams(
    filters?: LiveStreamFilters
  ): Promise<{ streams: LiveStream[]; nextCursor?: string; total: number }> {
    let streams = await this.getStreams()
    
    // Filter by status - only show live by default
    if (!filters?.status || filters.status.length === 0) {
      streams = streams.filter(s => s.status === 'live')
    } else {
      streams = streams.filter(s => filters.status!.includes(s.status))
    }

    if (filters) {
      if (filters.category && filters.category.length > 0) {
        streams = streams.filter(s => filters.category!.includes(s.category))
      }

      if (filters.hostId) {
        streams = streams.filter(s => s.hostId === filters.hostId)
      }
    }

    // Sort
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'recent':
          streams.sort((a, b) => {
            const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0
            const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0
            return bTime - aTime
          })
          break
        case 'popular':
          streams.sort((a, b) => b.viewerCount - a.viewerCount)
          break
        case 'viewers':
          streams.sort((a, b) => b.peakViewerCount - a.peakViewerCount)
          break
      }
    } else {
      // Default: most viewers first
      streams.sort((a, b) => b.viewerCount - a.viewerCount)
    }

    const total = streams.length
    const limit = filters?.limit || 20
    const startIndex = filters?.cursor ? parseInt(filters.cursor, 10) : 0
    const endIndex = startIndex + limit
    const paginated = streams.slice(startIndex, endIndex)
    const nextCursor = endIndex < total ? endIndex.toString() : undefined

    return {
      streams: paginated,
      nextCursor,
      total
    }
  }

  /**
   * GET /live/:id
   */
  async getStreamById(id: string): Promise<LiveStream | null> {
    const streams = await this.getStreams()
    return streams.find(s => s.id === id) || null
  }

  /**
   * POST /live/:id/join
   * Join a stream (increment viewer count)
   */
  async joinStream(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar?: string
  ): Promise<LiveStreamViewer> {
    const viewers = await this.getViewers()
    const streams = await this.getStreams()
    
    // Check if already viewing
    const existing = viewers.find(
      v => v.streamId === streamId && v.userId === userId && !v.leftAt
    )

    if (existing) {
      return existing
    }

    const viewer: LiveStreamViewer = {
      id: generateULID(),
      streamId,
      userId,
      userName,
      userAvatar,
      joinedAt: new Date().toISOString(),
      reactionsSent: 0
    }

    viewers.push(viewer)
    await this.setViewers(viewers)

    // Increment viewer count
    const streamToUpdate = streams.find(s => s.id === streamId)
    if (streamToUpdate) {
      streamToUpdate.viewerCount = (streamToUpdate.viewerCount ?? 0) + 1
      if ((streamToUpdate.viewerCount ?? 0) > (streamToUpdate.peakViewerCount ?? 0)) {
        streamToUpdate.peakViewerCount = streamToUpdate.viewerCount ?? 0
      }
      await this.setStreams(streams)
    }

    return viewer
  }

  /**
   * POST /live/:id/leave
   * Leave a stream (decrement viewer count)
   */
  async leaveStream(streamId: string, userId: string): Promise<void> {
    const viewers = await this.getViewers()
    const streams = await this.getStreams()
    
    const viewerIndex = viewers.findIndex(
      v => v.streamId === streamId && v.userId === userId && !v.leftAt
    )

    if (viewerIndex !== -1) {
      const viewer = viewers[viewerIndex]
      if (viewer) {
        viewer.leftAt = new Date().toISOString()
        await this.setViewers(viewers)

        // Decrement viewer count
        const streamToUpdate = streams.find(s => s.id === streamId)
        if (streamToUpdate) {
          streamToUpdate.viewerCount = Math.max(0, (streamToUpdate.viewerCount ?? 0) - 1)
          await this.setStreams(streams)
        }
      }
    }
  }

  /**
   * POST /live/:id/react
   * Send a reaction (❤️👏🔥)
   */
  async sendReaction(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    emoji: '❤️' | '👏' | '🔥' | '😊' | '🎉'
  ): Promise<LiveStreamReaction> {
    const reactions = await this.getReactions()
    const streams = await this.getStreams()
    
    const reaction: LiveStreamReaction = {
      id: generateULID(),
      streamId,
      userId,
      userName,
      userAvatar,
      emoji,
      createdAt: new Date().toISOString()
    }

    reactions.push(reaction)
    await this.setReactions(reactions)

    // Increment reactions count
    const streamToUpdate = streams.find(s => s.id === streamId)
    if (streamToUpdate) {
      streamToUpdate.reactionsCount = (streamToUpdate.reactionsCount ?? 0) + 1
      await this.setStreams(streams)
    }

    // Broadcast reaction via WebSocket to all viewers
    try {
      realtime.broadcastReaction(streamToUpdate?.roomId || `live:${streamId}`, {
        id: reaction.id,
        userId: reaction.userId,
        userName: reaction.userName,
        userAvatar: reaction.userAvatar,
        emoji: reaction.emoji,
        createdAt: reaction.createdAt
      })
      logger.debug('Reaction broadcasted', {
        streamId,
        reactionId: reaction.id
      })
    } catch (error) {
      logger.error('Failed to broadcast reaction', error instanceof Error ? error : new Error(String(error)), {
        streamId,
        reactionId: reaction.id
      })
      // Don't fail reaction creation if broadcast fails
    }

    return reaction
  }

  /**
   * POST /live/:id/chat
   * Send a chat message (via WebSocket in real app)
   */
  async sendChatMessage(
    streamId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    text: string
  ): Promise<LiveStreamChatMessage> {
    const messages = await this.getChatMessages()
    const streams = await this.getStreams()
    
    // Verify stream exists and allows chat
    const stream = streams.find(s => s.id === streamId)
    if (!stream) {
      throw new Error('Stream not found')
    }
    if (!stream.allowChat) {
      throw new Error('Chat is disabled for this stream')
    }
    if (stream.status !== 'live') {
      throw new Error('Stream is not live')
    }

    const message: LiveStreamChatMessage = {
      id: generateULID(),
      streamId,
      userId,
      userName,
      userAvatar,
      text,
      createdAt: new Date().toISOString(),
      banned: false
    }

    messages.push(message)
    await this.setChatMessages(messages)

    // Broadcast via WebSocket: live:<roomId>:chat
    try {
      realtime.broadcastChatMessage(stream.roomId, {
        id: message.id,
        userId: message.userId,
        userName: message.userName,
        userAvatar: message.userAvatar,
        text: message.text,
        createdAt: message.createdAt
      })
      logger.debug('Chat message broadcasted', {
        streamId,
        messageId: message.id
      })
    } catch (error) {
      logger.error('Failed to broadcast chat message', error instanceof Error ? error : new Error(String(error)), {
        streamId,
        messageId: message.id
      })
      // Don't fail message creation if broadcast fails
    }

    return message
  }

  /**
   * GET /live/:id/chat
   * Get chat messages
   */
  async queryChatMessages(streamId: string): Promise<LiveStreamChatMessage[]> {
    const messages = await this.getChatMessages()
    return messages
      .filter(m => m.streamId === streamId && !m.deletedAt && !m.banned)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  /**
   * Admin: Get all streams
   */
  async getAllStreams(): Promise<LiveStream[]> {
    return await this.getStreams()
  }
}

export const liveStreamingAPI = new LiveStreamingAPI()

