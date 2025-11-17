/**
 * useChatMessages Hook
 *
 * Shared hook for managing chat messages
 */

import { useState, useCallback, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'sticker' | 'voice' | 'location' | 'image';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reactions?: MessageReaction[];
  metadata?: Record<string, unknown>;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: string;
}

export interface UseChatMessagesOptions {
  conversationId: string;
  currentUserId: string;
  onMessageReceived?: (message: ChatMessage) => void;
}

export interface UseChatMessagesResult {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string, type?: ChatMessage['type']) => Promise<ChatMessage>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useChatMessages({
  conversationId,
  currentUserId,
  onMessageReceived,
}: UseChatMessagesOptions): UseChatMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // In a real implementation, this would fetch from API
      setMessages([]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, type: ChatMessage['type'] = 'text'): Promise<ChatMessage> => {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        conversationId,
        senderId: currentUserId,
        content,
        type,
        timestamp: new Date().toISOString(),
        status: 'sending',
      };

      setMessages((prev) => [...prev, newMessage]);

      // In a real implementation, this would send to API
      // For now, simulate success
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg))
        );
      }, 100);

      return newMessage;
    },
    [conversationId, currentUserId]
  );

  const addReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const reactions = msg.reactions ?? [];
          const existingReaction = reactions.find(
            (r) => r.userId === currentUserId && r.emoji === emoji
          );
          if (existingReaction) {
            return {
              ...msg,
              reactions: reactions.filter((r) => r.userId !== currentUserId || r.emoji !== emoji),
            };
          }
          return {
            ...msg,
            reactions: [
              ...reactions,
              {
                emoji,
                userId: currentUserId,
                timestamp: new Date().toISOString(),
              },
            ],
          };
        })
      );
    },
    [currentUserId]
  );

  const deleteMessage = useCallback(async (messageId: string): Promise<void> => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    addReaction,
    deleteMessage,
    refresh,
  };
}

