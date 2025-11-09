import { createLogger } from './logger'

const logger = createLogger('realtime')

type EventCallback = (data: unknown) => void

interface QueuedEvent {
  id: string
  name: string
  data: unknown
  timestamp: number
}

export interface WebRTCSignalData {
  type: 'offer' | 'answer' | 'candidate' | 'end'
  from: string
  to: string
  callId: string
  data?: unknown
}

export class RealtimeClient {
  private listeners = new Map<string, Set<EventCallback>>()
  private connected = false
  private accessToken: string | null = null
  private offlineQueue: QueuedEvent[] = []

  constructor() {
    // Constructor intentionally empty
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token
  }

  connect(): void {
    if (!this.accessToken) {
      logger.warn('Cannot connect without access token')
      return
    }

    this.connected = true
    void this.flushOfflineQueue()
  }

  disconnect(): void {
    this.connected = false
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  emit(event: string, data: unknown): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.connected) {
        this.enqueueOfflineEvent(event, data)
        resolve({ success: false, error: 'Offline' })
        return
      }

      try {
        resolve({ success: true })
        this.processEvent(event, data)
      } catch (error) {
        resolve({ success: false, error: (error instanceof Error ? error : new Error(String(error))).message })
      }
    })
  }

  private processEvent(event: string, data: unknown): void {
    if (event === 'message_send') {
      this.trigger('message_delivered', { messageId: (data as { messageId?: string }).messageId })
    } else if (event === 'webrtc_signal') {
      const signalData = data as WebRTCSignalData
      this.trigger(`webrtc_signal:${signalData.to}:${signalData.callId}`, signalData)
      this.trigger('webrtc_signal_received', signalData)
    } else if (event === 'typing_start' || event === 'typing_stop') {
      this.trigger(event, data)
    }
  }

  trigger(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          logger.error(
            `Error in event listener for ${event}`,
            error instanceof Error ? error : new Error(String(error))
          )
        }
      })
    }
  }

  private enqueueOfflineEvent(event: string, data: unknown): void {
    this.offlineQueue.push({
      id: `${Date.now()}-${Math.random()}`,
      name: event,
      data,
      timestamp: Date.now(),
    })
  }

  private async flushOfflineQueue(): Promise<void> {
    const queue = [...this.offlineQueue]
    this.offlineQueue = []

    for (const event of queue) {
      await this.emit(event.name, event.data)
    }
  }

  emitMatchCreated(match: unknown): void {
    this.trigger('match_created', match)
  }

  emitNewMessage(message: unknown): void {
    this.trigger('message_received', message)
  }

  emitNotification(notification: unknown): void {
    this.trigger('notification', notification)
  }

  emitUserOnline(userId: string): void {
    this.trigger('user_online', userId)
  }

  emitUserOffline(userId: string): void {
    this.trigger('user_offline', userId)
  }

  emitTyping(userId: string, roomId: string, isTyping: boolean): void {
    this.trigger('user_typing', { userId, roomId, isTyping })
  }

  async emitWebRTCSignal(
    signalData: WebRTCSignalData
  ): Promise<{ success: boolean; error?: string }> {
    return this.emit('webrtc_signal', signalData)
  }

  onWebRTCSignal(
    callId: string,
    currentUserId: string,
    callback: (signal: WebRTCSignalData) => void
  ): () => void {
    const eventKey = `webrtc_signal:${currentUserId}:${callId}`

    const signalHandler = (data: unknown) => {
      const signal = data as WebRTCSignalData
      if (signal.callId === callId && signal.to === currentUserId) {
        callback(signal)
      }
    }

    this.on(eventKey, signalHandler)
    this.on('webrtc_signal_received', signalHandler)

    return () => {
      this.off(eventKey, signalHandler)
      this.off('webrtc_signal_received', signalHandler)
    }
  }

  broadcastToRoom(roomId: string, event: string, data: unknown): void {
    const roomEvent = `room:${roomId}:${event}`
    this.trigger(roomEvent, data)
    if (typeof data === 'object' && data !== null) {
      this.trigger(event, { roomId, ...(data as Record<string, unknown>) })
    } else {
      this.trigger(event, { roomId })
    }
  }

  broadcastReaction(
    roomId: string,
    reaction: {
      id: string
      userId: string
      userName: string
      userAvatar?: string
      emoji: string
      createdAt: string
    }
  ): void {
    this.broadcastToRoom(roomId, 'reaction', reaction)
  }

  broadcastChatMessage(
    roomId: string,
    message: {
      id: string
      userId: string
      userName: string
      userAvatar?: string
      text: string
      createdAt: string
    }
  ): void {
    this.broadcastToRoom(roomId, 'chat', message)
  }
}

export const realtime = new RealtimeClient()
