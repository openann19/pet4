import type {
  LiveStream,
  StreamViewer,
  StreamChatMessage,
  CreateStreamData,
  StreamStatus,
  StreamReport
} from './streaming-types'
import { generateULID } from './utils'

class StreamingService {
  private async getStreams(): Promise<LiveStream[]> {
    return await spark.kv.get<LiveStream[]>('live-streams') || []
  }

  private async setStreams(streams: LiveStream[]): Promise<void> {
    await spark.kv.set('live-streams', streams)
  }

  private async getChatMessages(streamId: string): Promise<StreamChatMessage[]> {
    return await spark.kv.get<StreamChatMessage[]>(`stream-chat-${streamId}`) || []
  }

  private async setChatMessages(streamId: string, messages: StreamChatMessage[]): Promise<void> {
    await spark.kv.set(`stream-chat-${streamId}`, messages)
  }

  private async getViewers(streamId: string): Promise<StreamViewer[]> {
    return await spark.kv.get<StreamViewer[]>(`stream-viewers-${streamId}`) || []
  }

  private async setViewers(streamId: string, viewers: StreamViewer[]): Promise<void> {
    await spark.kv.set(`stream-viewers-${streamId}`, viewers)
  }

  async createStream(
    hostId: string,
    hostName: string,
    data: CreateStreamData,
    hostAvatar?: string
  ): Promise<LiveStream> {
    const streams = await this.getStreams()

    const existingLiveStream = streams.find(s =>
      s.hostId === hostId && (s.status === 'live' || s.status === 'connecting')
    )

    if (existingLiveStream) {
      throw new Error('You already have an active stream')
    }

    const stream: LiveStream = {
      id: generateULID(),
      hostId,
      hostName,
      hostAvatar,
      title: data.title,
      description: data.description,
      category: data.category,
      status: 'connecting',
      allowChat: data.allowChat,
      maxDuration: data.maxDuration,
      startedAt: new Date().toISOString(),
      viewerCount: 0,
      peakViewerCount: 0,
      totalViews: 0,
      likesCount: 0,
      roomToken: this.generateRoomToken(),
      tags: data.tags || []
    }

    streams.push(stream)
    await this.setStreams(streams)

    return stream
  }

  async getStreamById(streamId: string): Promise<LiveStream | undefined> {
    const streams = await this.getStreams()
    return streams.find(s => s.id === streamId)
  }

  async getActiveStreams(category?: string): Promise<LiveStream[]> {
    const streams = await this.getStreams()
    let activeStreams = streams.filter(s => s.status === 'live')

    if (category) {
      activeStreams = activeStreams.filter(s => s.category === category)
    }

    return activeStreams.sort((a, b) => b.viewerCount - a.viewerCount)
  }

  async getUserStreams(userId: string): Promise<LiveStream[]> {
    const streams = await this.getStreams()
    return streams
      .filter(s => s.hostId === userId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  }

  async updateStreamStatus(streamId: string, status: StreamStatus): Promise<void> {
    const streams = await this.getStreams()
    const index = streams.findIndex(s => s.id === streamId)

    if (index === -1) {
      throw new Error('Stream not found')
    }

    const stream = streams[index]
    if (!stream) {
      throw new Error('Stream not found')
    }
    
    stream.status = status

    if (status === 'ended') {
      stream.endedAt = new Date().toISOString()
    }

    await this.setStreams(streams)
  }

  async joinStream(streamId: string, userId: string, userName: string, userAvatar?: string): Promise<void> {
    const streams = await this.getStreams()
    const streamIndex = streams.findIndex(s => s.id === streamId)

    if (streamIndex === -1) {
      throw new Error('Stream not found')
    }

    const stream = streams[streamIndex]
    if (!stream) {
      throw new Error('Stream not found')
    }
    
    stream.viewerCount++
    stream.totalViews++

    if (stream.viewerCount > stream.peakViewerCount) {
      stream.peakViewerCount = stream.viewerCount
    }

    await this.setStreams(streams)

    const viewers = await this.getViewers(streamId)
    const existingViewer = viewers.find(v => v.userId === userId && !v.leftAt)

    if (!existingViewer) {
      const viewer: StreamViewer = {
        id: generateULID(),
        streamId,
        userId,
        userName,
        userAvatar,
        joinedAt: new Date().toISOString(),
        duration: 0
      }
      viewers.push(viewer)
      await this.setViewers(streamId, viewers)
    }
  }

  async leaveStream(streamId: string, userId: string): Promise<void> {
    const streams = await this.getStreams()
    const streamIndex = streams.findIndex(s => s.id === streamId)

    if (streamIndex !== -1) {
      const stream = streams[streamIndex]
      if (stream) {
        stream.viewerCount = Math.max(0, stream.viewerCount - 1)
        await this.setStreams(streams)
      }
    }

    const viewers = await this.getViewers(streamId)
    const viewerIndex = viewers.findIndex(v => v.userId === userId && !v.leftAt)

    if (viewerIndex !== -1) {
      const viewer = viewers[viewerIndex]
      if (viewer) {
        viewer.leftAt = new Date().toISOString()
        const joinedTime = new Date(viewer.joinedAt).getTime()
        const leftTime = new Date(viewer.leftAt).getTime()
        viewer.duration = Math.floor((leftTime - joinedTime) / 1000)
        await this.setViewers(streamId, viewers)
      }
    }
  }

  async sendChatMessage(
    streamId: string,
    userId: string,
    userName: string,
    message: string,
    userAvatar?: string
  ): Promise<StreamChatMessage> {
    const messages = await this.getChatMessages(streamId)

    const chatMessage: StreamChatMessage = {
      id: generateULID(),
      streamId,
      userId,
      userName,
      userAvatar,
      message,
      timestamp: new Date().toISOString(),
      type: 'message'
    }

    messages.push(chatMessage)

    const maxMessages = 500
    if (messages.length > maxMessages) {
      messages.splice(0, messages.length - maxMessages)
    }

    await this.setChatMessages(streamId, messages)

    return chatMessage
  }

  async getChatHistory(streamId: string, limit: number = 100): Promise<StreamChatMessage[]> {
    const messages = await this.getChatMessages(streamId)
    return messages.slice(-limit)
  }

  async incrementLikes(streamId: string): Promise<void> {
    const streams = await this.getStreams()
    const index = streams.findIndex(s => s.id === streamId)

    if (index !== -1) {
      const stream = streams[index]
      if (stream) {
        stream.likesCount++
        await this.setStreams(streams)
      }
    }
  }

  async endStream(streamId: string): Promise<void> {
    await this.updateStreamStatus(streamId, 'ended')

    const viewers = await this.getViewers(streamId)
    const activeViewers = viewers.filter(v => !v.leftAt)

    for (const viewer of activeViewers) {
      await this.leaveStream(streamId, viewer.userId)
    }
  }

  async reportStream(
    streamId: string,
    reporterId: string,
    reason: StreamReport['reason'],
    description?: string
  ): Promise<void> {
    const reports = await spark.kv.get<StreamReport[]>('stream-reports') || []

    const report: StreamReport = {
      id: generateULID(),
      streamId,
      reporterId,
      reason,
      description,
      timestamp: new Date().toISOString(),
      resolved: false
    }

    reports.push(report)
    await spark.kv.set('stream-reports', reports)
  }

  async banUserFromStream(streamId: string, userId: string): Promise<void> {
    await this.leaveStream(streamId, userId)
  }

  private generateRoomToken(): string {
    return `room_${generateULID()}`
  }
}

export const streamingService = new StreamingService()
