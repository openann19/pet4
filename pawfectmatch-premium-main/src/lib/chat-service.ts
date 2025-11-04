/**
 * Chat Service
 * 
 * Handles message sending, delivery status, read receipts, reactions, and real-time updates.
 */

import type { Message, MessageType, ReactionType, ReadReceipt, TypingIndicator } from './chat-types'
import { generateULID } from './utils'
import { createLogger } from './logger'

const logger = createLogger('ChatService')

const KV_PREFIX = {
  MESSAGE: 'message:',
  ROOM: 'room:',
  READ_RECEIPT: 'read-receipt:',
  TYPING: 'typing:',
}

/**
 * Send message
 */
export async function sendMessage(
  roomId: string,
  senderId: string,
  type: MessageType,
  content: string,
  metadata?: Message['metadata']
): Promise<Message> {
  const message: Message = {
    id: generateULID(),
    roomId,
    senderId,
    type,
    content,
    status: 'sending',
    metadata,
    createdAt: new Date().toISOString(),
  }

  // Optimistic update - save immediately
  const key = `${KV_PREFIX.MESSAGE}${message.id}`
  await window.spark.kv.set(key, message)

  // Add to room messages
  const roomMessages = await window.spark.kv.get<Message[]>(`${KV_PREFIX.ROOM}${roomId}:messages`) || []
  roomMessages.push(message)
  await window.spark.kv.set(`${KV_PREFIX.ROOM}${roomId}:messages`, roomMessages)

  try {
    // Send to server
    const response = await fetch(`/api/v1/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        content,
        metadata,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      message.id = data.id
      message.status = 'sent'
      message.createdAt = data.createdAt

      // Update message
      await window.spark.kv.set(key, message)
      
      // Update in room messages
      const index = roomMessages.findIndex(m => m.id === message.id)
      if (index >= 0) {
        roomMessages[index] = message
        await window.spark.kv.set(`${KV_PREFIX.ROOM}${roomId}:messages`, roomMessages)
      }
    } else {
      message.status = 'failed'
      await window.spark.kv.set(key, message)
    }
  } catch (error) {
    logger.error('Send message error', error instanceof Error ? error : new Error(String(error)), { roomId, messageId: message.id })
    message.status = 'failed'
    await window.spark.kv.set(key, message)
  }

  return message
}

/**
 * Mark messages as read
 */
export async function markAsRead(
  roomId: string,
  messageId: string,
  userId: string
): Promise<void> {
  const receipt: ReadReceipt = {
    userId,
    messageId,
    roomId,
    readAt: new Date().toISOString(),
  }

  const key = `${KV_PREFIX.READ_RECEIPT}${messageId}:${userId}`
  await window.spark.kv.set(key, receipt)

  // Update message status
  const messageKey = `${KV_PREFIX.MESSAGE}${messageId}`
  const message = await window.spark.kv.get<Message>(messageKey)
  
  if (message && message.senderId !== userId) {
    message.status = 'read'
    await window.spark.kv.set(messageKey, message)

    // Notify server
    try {
      await fetch(`/api/v1/chat/rooms/${roomId}/read-receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      })
    } catch (error) {
      logger.error('Mark as read error', error instanceof Error ? error : new Error(String(error)), { roomId, messageId, userId })
    }
  }
}

/**
 * Add reaction to message
 */
export async function addReaction(
  messageId: string,
  userId: string,
  reaction: ReactionType
): Promise<void> {
  const messageKey = `${KV_PREFIX.MESSAGE}${messageId}`
  const message = await window.spark.kv.get<Message>(messageKey)

  if (!message) {
    throw new Error('Message not found')
  }

  // Normalize reactions to record format
  let reactionsRecord: Record<ReactionType, string[]>
  if (!message.reactions) {
    reactionsRecord = {} as Record<ReactionType, string[]>
  } else if (Array.isArray(message.reactions)) {
    // Convert array to record format
    reactionsRecord = {} as Record<ReactionType, string[]>
    for (const r of message.reactions) {
      if (r.emoji && r.userIds) {
        reactionsRecord[r.emoji as ReactionType] = [...r.userIds]
      }
    }
  } else {
    reactionsRecord = { ...message.reactions } as Record<ReactionType, string[]>
  }

  if (!reactionsRecord[reaction]) {
    reactionsRecord[reaction] = []
  }

  // Toggle reaction
  const index = reactionsRecord[reaction].indexOf(userId)
  if (index >= 0) {
    reactionsRecord[reaction].splice(index, 1)
    if (reactionsRecord[reaction].length === 0) {
      delete reactionsRecord[reaction]
    }
  } else {
    reactionsRecord[reaction].push(userId)
  }

  message.reactions = reactionsRecord

  await window.spark.kv.set(messageKey, message)

  // Notify server
  try {
    await fetch(`/api/v1/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction }),
    })
  } catch (error) {
    logger.error('Add reaction error', error instanceof Error ? error : new Error(String(error)), { messageId, userId, reaction })
  }
}

/**
 * Send typing indicator
 */
export async function sendTypingIndicator(
  roomId: string,
  userId: string
): Promise<void> {
  const indicator: TypingIndicator = {
    userId,
    roomId,
    startedAt: new Date().toISOString(),
  }

  const key = `${KV_PREFIX.TYPING}${roomId}:${userId}`
  await window.spark.kv.set(key, indicator)

  // Throttle - only send every 2 seconds
  const lastSent = await window.spark.kv.get<number>(`${key}:last-sent`)
  const now = Date.now()
  
  if (!lastSent || now - lastSent > 2000) {
    try {
      await fetch(`/api/v1/chat/rooms/${roomId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      
      await window.spark.kv.set(`${key}:last-sent`, now)
    } catch (error) {
      logger.error('Typing indicator error', error instanceof Error ? error : new Error(String(error)), { roomId, userId })
    }
  }

  // Auto-clear after 3 seconds
  setTimeout(async () => {
    await window.spark.kv.delete(key)
  }, 3000)
}

/**
 * Get room messages
 */
export async function getRoomMessages(
  roomId: string,
  cursor?: string
): Promise<{ messages: Message[]; nextCursor?: string }> {
  try {
    const response = await fetch(
      `/api/v1/chat/rooms/${roomId}/messages?${cursor ? `cursor=${cursor}` : ''}`
    )

    if (response.ok) {
      const data = await response.json()
      return {
        messages: data.messages || [],
        nextCursor: data.nextCursor,
      }
    }
  } catch (error) {
    logger.error('Get messages error', error instanceof Error ? error : new Error(String(error)), { roomId, cursor })
  }

  // Fallback to local storage
  const roomMessages = await window.spark.kv.get<Message[]>(
    `${KV_PREFIX.ROOM}${roomId}:messages`
  ) || []

  return { messages: roomMessages }
}

/**
 * Delete message (revoke if within 2 minutes)
 */
export async function deleteMessage(
  messageId: string,
  userId: string,
  forEveryone: boolean = false
): Promise<void> {
  const messageKey = `${KV_PREFIX.MESSAGE}${messageId}`
  const message = await window.spark.kv.get<Message>(messageKey)

  if (!message) {
    throw new Error('Message not found')
  }

  const messageAge = Date.now() - new Date(message.createdAt).getTime()
  const twoMinutes = 2 * 60 * 1000

  if (message.senderId === userId && messageAge < twoMinutes && forEveryone) {
    // Revoke for everyone
    message.deletedAt = new Date().toISOString()
    await window.spark.kv.set(messageKey, message)

    // Notify server
    try {
      await fetch(`/api/v1/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forEveryone: true }),
      })
    } catch (error) {
      logger.error('Delete message error', error instanceof Error ? error : new Error(String(error)), { messageId, userId, forEveryone })
    }
  } else {
    // Delete for me only
    if (!message.deletedFor) {
      message.deletedFor = []
    }
    message.deletedFor.push(userId)
    await window.spark.kv.set(messageKey, message)
  }
}

