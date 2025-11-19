import { useCallback, useEffect, useRef } from 'react';
import { useAnimatedStyle } from '@petspark/motion';

import type { ChatMessage } from '@/lib/chat-types';

/**
 * Hook for managing chat window effects (scrolling, marking as read)
 */
export function useChatEffects(
  messages: ChatMessage[] | undefined,
  roomId: string,
  markChatAsRead: (messageId: string) => Promise<void>
) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const markMessagesAsRead = useCallback(() => {
    const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    if (lastMsg?.id) {
      void markChatAsRead(lastMsg.id)
        .catch(() => {
          // Silently handle errors - error handling is done in the hook
        })
        .then(() => {
          // Promise handled
        });
    }
  }, [messages, markChatAsRead]);

  useEffect(() => {
    markMessagesAsRead();
  }, [roomId, markMessagesAsRead]);

  const dateGroupStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ scale: 1 }],
  })) as AnimatedStyle;

  const messageItemStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }] as Record<string, number | string>[],
  })) as AnimatedStyle;

  const typingIndicatorStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ translateY: 0 }],
  })) as AnimatedStyle;

  return {
    scrollRef,
    scrollToBottom,
    dateGroupStyle,
    messageItemStyle,
    typingIndicatorStyle,
  };
}

