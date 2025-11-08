/**
 * Chat API Service
 *
 * Handles chat messages, reactions, read receipts, and typing indicators through backend API.
 */

import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Message, MessageType, ReactionType } from '@/lib/chat-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ChatApi');

export interface SendMessageRequest {
  type: MessageType;
  content: string;
  metadata?: Message['metadata'];
}

export interface SendMessageResponse {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  content: string;
  status: Message['status'];
  createdAt: string;
  metadata?: Message['metadata'];
}

export interface GetMessagesResponse {
  messages: Message[];
  nextCursor?: string;
}

export interface AddReactionRequest {
  reaction: ReactionType;
}

export interface TypingIndicatorRequest {
  userId: string;
}

class ChatApiImpl {
  /**
   * Send a message to a chat room
   */
  async sendMessage(roomId: string, request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await APIClient.post<SendMessageResponse>(
        ENDPOINTS.CHAT.SEND_MESSAGE(roomId),
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send message', err, { roomId, type: request.type });
      throw err;
    }
  }

  /**
   * Get messages for a chat room
   */
  async getMessages(roomId: string, cursor?: string): Promise<GetMessagesResponse> {
    try {
      const query = cursor ? `?cursor=${cursor}` : '';
      const response = await APIClient.get<GetMessagesResponse>(
        `${ENDPOINTS.CHAT.MESSAGES(roomId)}${query}`
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get messages', err, { roomId, cursor });
      throw err;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(roomId: string, messageId: string): Promise<void> {
    try {
      await APIClient.post(`${ENDPOINTS.CHAT.MARK_READ(roomId)}`, { messageId });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to mark as read', err, { roomId, messageId });
      throw err;
    }
  }

  /**
   * Add or toggle reaction on a message
   */
  async addReaction(messageId: string, request: AddReactionRequest): Promise<Message> {
    try {
      const response = await APIClient.post<Message>(
        `/api/v1/chat/messages/${messageId}/reactions`,
        request
      );
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to add reaction', err, { messageId, reaction: request.reaction });
      throw err;
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(roomId: string, request: TypingIndicatorRequest): Promise<void> {
    try {
      await APIClient.post(`/api/v1/chat/rooms/${roomId}/typing`, request);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send typing indicator', err, { roomId, userId: request.userId });
      throw err;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, forEveryone = false): Promise<void> {
    try {
      await APIClient.delete(`/api/v1/chat/messages/${messageId}`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forEveryone }),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to delete message', err, { messageId, forEveryone });
      throw err;
    }
  }

  /**
   * Get conversations/rooms for current user
   */
  async getConversations(): Promise<
    { id: string; participants: string[]; lastMessage?: Message; updatedAt: string }[]
  > {
    try {
      const response = await APIClient.get<
        { id: string; participants: string[]; lastMessage?: Message; updatedAt: string }[]
      >(ENDPOINTS.CHAT.CONVERSATIONS);
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get conversations', err);
      return [];
    }
  }

  /**
   * Get conversation/room details
   */
  async getConversation(
    conversationId: string
  ): Promise<{ id: string; participants: string[]; createdAt: string }> {
    try {
      const response = await APIClient.get<{
        id: string;
        participants: string[];
        createdAt: string;
      }>(ENDPOINTS.CHAT.CONVERSATION(conversationId));
      return response.data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get conversation', err, { conversationId });
      throw err;
    }
  }
}

export const chatApi = new ChatApiImpl();
