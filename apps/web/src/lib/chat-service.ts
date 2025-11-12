/**
 * Chat Service
 *
 * Handles message sending, delivery status, read receipts, reactions, and real-time updates.
 * Migrated from legacy KV mocks to use backend API endpoints.
 */

import type { Message, MessageType, ReactionType } from './chat-types';
import { chatApi } from '@/api/chat-api';
import { createLogger } from './logger';

const logger = createLogger('ChatService');

// Local cache for optimistic updates (client-side only, not persisted)
const messageCache = new Map<string, Message>();
const roomMessagesCache = new Map<string, Message[]>();

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
  // Create optimistic message
  const optimisticMessage: Message = {
    id: `temp-${String(Date.now() ?? '')}`,
    roomId,
    senderId,
    type,
    content,
    status: 'sending',
    ...(metadata !== undefined && { metadata }),
    createdAt: new Date().toISOString(),
  };

  // Optimistic update - cache immediately
  messageCache.set(optimisticMessage.id, optimisticMessage);
  const cachedRoomMessages = roomMessagesCache.get(roomId) || [];
  cachedRoomMessages.push(optimisticMessage);
  roomMessagesCache.set(roomId, cachedRoomMessages);

  try {
    // Send to server
    const response = await chatApi.sendMessage(roomId, {
      type,
      content,
      ...(metadata !== undefined && { metadata }),
    });

    // Update optimistic message with server response
    const finalMessage: Message = {
      ...optimisticMessage,
      id: response.id,
      status: response.status,
      createdAt: response.createdAt,
    };

    // Update cache
    messageCache.delete(optimisticMessage.id);
    messageCache.set(finalMessage.id, finalMessage);

    const roomIndex = cachedRoomMessages.findIndex((m) => m.id === optimisticMessage.id);
    if (roomIndex >= 0) {
      cachedRoomMessages[roomIndex] = finalMessage;
      roomMessagesCache.set(roomId, cachedRoomMessages);
    }

    return finalMessage;
  } catch (error) {
    // Mark as failed
    optimisticMessage.status = 'failed';
    messageCache.set(optimisticMessage.id, optimisticMessage);

    const roomIndex = cachedRoomMessages.findIndex((m) => m.id === optimisticMessage.id);
    if (roomIndex >= 0) {
      cachedRoomMessages[roomIndex] = optimisticMessage;
      roomMessagesCache.set(roomId, cachedRoomMessages);
    }

    logger.error('Send message error', error instanceof Error ? error : new Error(String(error)), {
      roomId,
      messageId: optimisticMessage.id,
    });
    throw error;
  }
}

/**
 * Mark messages as read
 */
export async function markAsRead(roomId: string, messageId: string, userId: string): Promise<void> {
  try {
    await chatApi.markAsRead(roomId, messageId);

    // Update cached message status
    const message = messageCache.get(messageId);
    if (message && message.senderId !== userId) {
      message.status = 'read';
      messageCache.set(messageId, message);
    }
  } catch (error) {
    logger.error('Mark as read error', error instanceof Error ? error : new Error(String(error)), {
      roomId,
      messageId,
      userId,
    });
    throw error;
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
  try {
    const updatedMessage = await chatApi.addReaction(messageId, { reaction });

    // Update cached message
    messageCache.set(messageId, updatedMessage);

    // Update in room cache
    const roomId = updatedMessage.roomId;
    const roomMessages = roomMessagesCache.get(roomId) || [];
    const index = roomMessages.findIndex((m) => m.id === messageId);
    if (index >= 0) {
      roomMessages[index] = updatedMessage;
      roomMessagesCache.set(roomId, roomMessages);
    }
  } catch (error) {
    logger.error('Add reaction error', error instanceof Error ? error : new Error(String(error)), {
      messageId,
      userId,
      reaction,
    });
    throw error;
  }
}

/**
 * Send typing indicator
 */
export async function sendTypingIndicator(roomId: string, userId: string): Promise<void> {
  // Throttle - only send every 2 seconds
  const lastSentKey = `typing:${roomId}:${userId}:last-sent`;
  const lastSent = messageCache.get(lastSentKey)?.createdAt
    ? new Date(messageCache.get(lastSentKey)!.createdAt).getTime()
    : 0;
  const now = Date.now();

  if (lastSent && now - lastSent < 2000) {
    return; // Skip - too soon
  }

  try {
    await chatApi.sendTypingIndicator(roomId, { userId });

    // Cache timestamp
    const timestampMessage: Message = {
      id: lastSentKey,
      roomId,
      senderId: userId,
      type: 'text',
      content: '',
      status: 'sent',
      createdAt: new Date(now).toISOString(),
    };
    messageCache.set(lastSentKey, timestampMessage);
  } catch (error) {
    logger.error(
      'Typing indicator error',
      error instanceof Error ? error : new Error(String(error)),
      { roomId, userId }
    );
    // Don't throw - typing indicator is non-critical
  }
}

/**
 * Get room messages
 */
export async function getRoomMessages(
  roomId: string,
  cursor?: string
): Promise<{ messages: Message[]; nextCursor?: string }> {
  try {
    const result = await chatApi.getMessages(roomId, cursor);

    // Update cache
    if (!cursor) {
      // First page - replace cache
      roomMessagesCache.set(roomId, result.messages);
    } else {
      // Subsequent pages - append to cache
      const cached = roomMessagesCache.get(roomId) || [];
      roomMessagesCache.set(roomId, [...cached, ...result.messages]);
    }

    // Cache individual messages
    result.messages.forEach((msg) => {
      messageCache.set(msg.id, msg);
    });

    return result;
  } catch (error) {
    logger.error('Get messages error', error instanceof Error ? error : new Error(String(error)), {
      roomId,
      cursor,
    });

    // Fallback to cached messages
    const cached = roomMessagesCache.get(roomId) || [];
    return { messages: cached };
  }
}

/**
 * Delete message (revoke if within 2 minutes)
 */
export async function deleteMessage(
  messageId: string,
  userId: string,
  forEveryone = false
): Promise<void> {
  const cachedMessage = messageCache.get(messageId);

  if (!cachedMessage) {
    throw new Error('Message not found');
  }

  const messageAge = Date.now() - new Date(cachedMessage.createdAt).getTime();
  const twoMinutes = 2 * 60 * 1000;

  if (cachedMessage.senderId === userId && messageAge < twoMinutes && forEveryone) {
    // Revoke for everyone
    try {
      await chatApi.deleteMessage(messageId, true);

      // Update cache
      cachedMessage.deletedAt = new Date().toISOString();
      messageCache.set(messageId, cachedMessage);

      // Update in room cache
      const roomMessages = roomMessagesCache.get(cachedMessage.roomId) || [];
      const index = roomMessages.findIndex((m) => m.id === messageId);
      if (index >= 0) {
        roomMessages[index] = cachedMessage;
        roomMessagesCache.set(cachedMessage.roomId, roomMessages);
      }
    } catch (error) {
      logger.error(
        'Delete message error',
        error instanceof Error ? error : new Error(String(error)),
        { messageId, userId, forEveryone }
      );
      throw error;
    }
  } else {
    // Delete for me only
    if (!cachedMessage.deletedFor) {
      cachedMessage.deletedFor = [];
    }
    cachedMessage.deletedFor.push(userId);
    messageCache.set(messageId, cachedMessage);
  }
}
