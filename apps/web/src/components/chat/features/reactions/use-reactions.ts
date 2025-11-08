'use client';

import { useCallback } from 'react';
import type { ChatMessage, MessageReaction, ReactionType } from '@/lib/chat-types';
import { haptics } from '@/lib/haptics';

export interface UseReactionsOptions {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string | null;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export interface UseReactionsReturn {
  handleReaction: (messageId: string, emoji: string) => void;
  getReactionsForMessage: (messageId: string) => MessageReaction[];
  hasUserReacted: (messageId: string, emoji?: string) => boolean;
}

export function useReactions(options: UseReactionsOptions): UseReactionsReturn {
  const { currentUserId, currentUserName, currentUserAvatar, messages, setMessages } = options;

  const handleReaction = useCallback(
    (messageId: string, emoji: string): void => {
      haptics.trigger('selection');

      setMessages((current) =>
        (current || []).map((msg) => {
          if (msg.id === messageId) {
            const reactions = Array.isArray(msg.reactions) ? msg.reactions : [];
            const existingReaction = reactions.find((r) => r.userId === currentUserId);

            if (existingReaction?.emoji === emoji) {
              return {
                ...msg,
                reactions: reactions.filter((r) => r.userId !== currentUserId),
              };
            } else if (existingReaction) {
              return {
                ...msg,
                reactions: reactions.map((r) =>
                  r.userId === currentUserId
                    ? { ...r, emoji: emoji as ReactionType, timestamp: new Date().toISOString() }
                    : r
                ),
              };
            } else {
              const newReaction: MessageReaction = {
                emoji: emoji as ReactionType,
                userId: currentUserId,
                userName: currentUserName,
                timestamp: new Date().toISOString(),
                ...(currentUserAvatar ? { userAvatar: currentUserAvatar } : {}),
              };
              return {
                ...msg,
                reactions: [...reactions, newReaction],
              };
            }
          }
          return msg;
        })
      );
    },
    [currentUserId, currentUserName, currentUserAvatar, setMessages]
  );

  const getReactionsForMessage = useCallback(
    (messageId: string): MessageReaction[] => {
      const message = messages.find((m) => m.id === messageId);
      return Array.isArray(message?.reactions) ? message.reactions : [];
    },
    [messages]
  );

  const hasUserReacted = useCallback(
    (messageId: string, emoji?: string): boolean => {
      const reactions = getReactionsForMessage(messageId);
      const userReaction = reactions.find((r) => r.userId === currentUserId);
      if (!userReaction) return false;
      if (emoji) return userReaction.emoji === emoji;
      return true;
    },
    [currentUserId, getReactionsForMessage]
  );

  return {
    handleReaction,
    getReactionsForMessage,
    hasUserReacted,
  };
}
