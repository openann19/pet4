/**
 * useTyping Hook
 *
 * Shared hook for managing typing indicators
 */

import { useState, useCallback, useEffect } from 'react';

export interface TypingState {
  conversationId: string;
  typingUsers: Array<{
    userId: string;
    displayName: string;
    startedAt: string;
  }>;
}

export interface UseTypingOptions {
  conversationId: string;
  currentUserId: string;
  currentDisplayName: string;
  onTypingStart?: (userId: string) => void;
  onTypingStop?: (userId: string) => void;
}

export interface UseTypingResult {
  typingUsers: Array<{ userId: string; displayName: string }>;
  isTyping: boolean;
  startTyping: () => void;
  stopTyping: () => void;
}

export function useTyping({
  conversationId,
  currentUserId,
  currentDisplayName,
  onTypingStart,
  onTypingStop,
}: UseTypingOptions): UseTypingResult {
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; displayName: string }>>(
    []
  );
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = { current: null as NodeJS.Timeout | null };

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.(currentUserId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop?.(currentUserId);
    }, 3000);
  }, [isTyping, currentUserId, onTypingStart, onTypingStop]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTyping) {
      setIsTyping(false);
      onTypingStop?.(currentUserId);
    }
  }, [isTyping, currentUserId, onTypingStop]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
  };
}

