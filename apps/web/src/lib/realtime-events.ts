/**
 * Enhanced Realtime Events
 * 
 * Complete implementation of all required realtime events with acknowledgment
 */

import { WebSocketManager } from './websocket-manager'
import { config } from './config'
import { createLogger } from './logger'
import type { Match, Message } from './contracts'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('RealtimeEvents')

export interface ChatEvent {
  chat: {
    join_room: { roomId: string; userId: string }
    message_send: { messageId: string; roomId: string; content: string; senderId: string }
    message_delivered: { messageId: string; roomId: string; recipientId: string }
    message_read: { messageId: string; roomId: string; readerId: string }
    typing: { roomId: string; userId: string; isTyping: boolean }
  }
  presence: {
    user_online: { userId: string; lastSeenAt: string }
    user_offline: { userId: string; lastSeenAt: string }
  }
  notifications: {
    match_created: { match: Match }
    like_received: { fromPetId: string; toPetId: string }
    story_viewed: { storyId: string; viewerId: string; petId: string }
  }
}

type EventHandler = (data: unknown) => void
type Unsubscribe = () => void

export class RealtimeEvents {
  private wsManager: WebSocketManager
  private pendingAcks: Map<string, {
    resolve: () => void
    reject: (error: Error) => void
    timeout: number
  }> = new Map()
  private ackTimeout: number = 5000

  constructor(wsManager: WebSocketManager) {
    this.wsManager = wsManager
  }

  /**
   * Send event and wait for acknowledgment
   */
  private async sendWithAck(
    namespace: '/chat' | '/presence' | '/notifications',
    event: string,
    data: unknown
  ): Promise<void> {
    const messageId = this.wsManager.send(namespace, event, data)
    
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.pendingAcks.delete(messageId)
        reject(new Error(`Event acknowledgment timeout: ${String(event ?? '')}`))
      }, this.ackTimeout)

      this.pendingAcks.set(messageId, {
        resolve: () => {
          clearTimeout(timeout)
          this.pendingAcks.delete(messageId)
          resolve()
        },
        reject: (error: Error) => {
          clearTimeout(timeout)
          this.pendingAcks.delete(messageId)
          reject(error)
        },
        timeout
      })

      this.wsManager.on('message_acknowledged', (ackData: unknown) => {
        const data = ackData as { messageId: string }
        if (data.messageId === messageId) {
          const pending = this.pendingAcks.get(messageId)
          if (isTruthy(pending)) {
            pending.resolve()
          }
        }
      })

      this.wsManager.on('message_failed', (failData: unknown) => {
        const data = failData as { messageId: string; event: string }
        if (data.messageId === messageId) {
          const pending = this.pendingAcks.get(messageId)
          if (isTruthy(pending)) {
            pending.reject(new Error(`Event failed: ${String(data.event ?? '')}`))
          }
        }
      })
    })
  }

  /**
   * Chat namespace events
   */
  async joinRoom(roomId: string, userId: string): Promise<void> {
    logger.debug('Joining room', { roomId, userId })
    await this.sendWithAck('/chat', 'join_room', { roomId, userId })
  }

  async sendMessage(message: Message): Promise<void> {
    logger.debug('Sending message', { messageId: message.id, roomId: message.chatRoomId })
    await this.sendWithAck('/chat', 'message_send', {
      messageId: message.id,
      roomId: message.chatRoomId,
      content: message.content,
      senderId: message.senderId,
      type: message.type,
      timestamp: message.createdAt
    })
  }

  async markMessageDelivered(messageId: string, roomId: string, recipientId: string): Promise<void> {
    logger.debug('Marking message delivered', { messageId, roomId, recipientId })
    await this.sendWithAck('/chat', 'message_delivered', { messageId, roomId, recipientId })
  }

  async markMessageRead(messageId: string, roomId: string, readerId: string): Promise<void> {
    logger.debug('Marking message read', { messageId, roomId, readerId })
    await this.sendWithAck('/chat', 'message_read', { messageId, roomId, readerId })
  }

  async setTyping(roomId: string, userId: string, isTyping: boolean): Promise<void> {
    logger.debug('Setting typing status', { roomId, userId, isTyping })
    await this.sendWithAck('/chat', 'typing', { roomId, userId, isTyping })
  }

  /**
   * Presence namespace events
   */
  async userOnline(userId: string): Promise<void> {
    logger.debug('User online', { userId })
    await this.sendWithAck('/presence', 'user_online', {
      userId,
      lastSeenAt: new Date().toISOString()
    })
  }

  async userOffline(userId: string): Promise<void> {
    logger.debug('User offline', { userId })
    await this.sendWithAck('/presence', 'user_offline', {
      userId,
      lastSeenAt: new Date().toISOString()
    })
  }

  /**
   * Notifications namespace events
   */
  async notifyMatchCreated(match: Match): Promise<void> {
    logger.debug('Match created notification', { matchId: match.id })
    await this.sendWithAck('/notifications', 'match_created', { match })
  }

  async notifyLikeReceived(fromPetId: string, toPetId: string): Promise<void> {
    logger.debug('Like received notification', { fromPetId, toPetId })
    await this.sendWithAck('/notifications', 'like_received', { fromPetId, toPetId })
  }

  async notifyStoryViewed(storyId: string, viewerId: string, petId: string): Promise<void> {
    logger.debug('Story viewed notification', { storyId, viewerId, petId })
    await this.sendWithAck('/notifications', 'story_viewed', { storyId, viewerId, petId })
  }

  /**
   * Event listeners
   */
  onChatMessage(handler: (data: ChatEvent['chat']['message_send']) => void): Unsubscribe {
    return this.wsManager.on('chat:message_send', handler as EventHandler)
  }

  onMessageDelivered(handler: (data: ChatEvent['chat']['message_delivered']) => void): Unsubscribe {
    return this.wsManager.on('chat:message_delivered', handler as EventHandler)
  }

  onMessageRead(handler: (data: ChatEvent['chat']['message_read']) => void): Unsubscribe {
    return this.wsManager.on('chat:message_read', handler as EventHandler)
  }

  onTyping(handler: (data: ChatEvent['chat']['typing']) => void): Unsubscribe {
    return this.wsManager.on('chat:typing', handler as EventHandler)
  }

  onUserOnline(handler: (data: ChatEvent['presence']['user_online']) => void): Unsubscribe {
    return this.wsManager.on('presence:user_online', handler as EventHandler)
  }

  onUserOffline(handler: (data: ChatEvent['presence']['user_offline']) => void): Unsubscribe {
    return this.wsManager.on('presence:user_offline', handler as EventHandler)
  }

  onMatchCreated(handler: (data: ChatEvent['notifications']['match_created']) => void): Unsubscribe {
    return this.wsManager.on('notifications:match_created', handler as EventHandler)
  }

  onLikeReceived(handler: (data: ChatEvent['notifications']['like_received']) => void): Unsubscribe {
    return this.wsManager.on('notifications:like_received', handler as EventHandler)
  }

  onStoryViewed(handler: (data: ChatEvent['notifications']['story_viewed']) => void): Unsubscribe {
    return this.wsManager.on('notifications:story_viewed', handler as EventHandler)
  }
}

// Create singleton instance when WebSocketManager is available
let realtimeEventsInstance: RealtimeEvents | null = null

export function getRealtimeEvents(): RealtimeEvents {
  if (!realtimeEventsInstance) {
    const wsManager = new WebSocketManager({
      url: config.current.WS_URL
    })
    realtimeEventsInstance = new RealtimeEvents(wsManager)
  }
  return realtimeEventsInstance
}

