'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TypingUser } from '@/lib/chat-types';
import type { RealtimeClient } from '@/lib/realtime';

export interface UseTypingManagerOptions {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  realtimeClient?: RealtimeClient;
  typingTimeout?: number;
  debounceDelay?: number;
}

export interface UseTypingManagerReturn {
  typingUsers: TypingUser[];
  isTyping: boolean;
  startTyping: () => void;
  stopTyping: () => void;
  handleInputChange: (value: string) => void;
  handleMessageSend: () => void;
}

const DEFAULT_TYPING_TIMEOUT = 3000;
const DEFAULT_DEBOUNCE_DELAY = 500;

export function useTypingManager({
  roomId,
  currentUserId,
  currentUserName,
  realtimeClient,
  typingTimeout = DEFAULT_TYPING_TIMEOUT,
  debounceDelay = DEFAULT_DEBOUNCE_DELAY,
}: UseTypingManagerOptions): UseTypingManagerReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTypingEmitRef = useRef<number>(0);

  const emitTypingStart = useCallback(() => {
    if (!realtimeClient) return;

    const now = Date.now();
    if (now - lastTypingEmitRef.current < debounceDelay) {
      return;
    }

    lastTypingEmitRef.current = now;

    realtimeClient
      .emit('typing_start', {
        roomId,
        userId: currentUserId,
        userName: currentUserName,
      })
      .catch(() => {
        // Silent fail for typing events
      });
  }, [realtimeClient, roomId, currentUserId, currentUserName, debounceDelay]);

  const emitTypingStop = useCallback(() => {
    if (!realtimeClient) return;

    realtimeClient
      .emit('typing_stop', {
        roomId,
        userId: currentUserId,
      })
      .catch(() => {
        // Silent fail for typing events
      });
  }, [realtimeClient, roomId, currentUserId]);

  const stopTyping = useCallback(() => {
    if (!isTypingRef.current) return;

    isTypingRef.current = false;
    setIsTyping(false);
    emitTypingStop();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = undefined;
    }
  }, [emitTypingStop]);

  const startTyping = useCallback(() => {
    if (isTypingRef.current) return;

    isTypingRef.current = true;
    setIsTyping(true);
    emitTypingStart();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, typingTimeout);
  }, [typingTimeout, emitTypingStart, stopTyping]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (value.trim().length > 0) {
        debounceTimeoutRef.current = setTimeout(() => {
          startTyping();
        }, debounceDelay);
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping, debounceDelay]
  );

  const handleMessageSend = useCallback(() => {
    stopTyping();
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = undefined;
    }
  }, [stopTyping]);

  useEffect(() => {
    if (!realtimeClient) return;

    const handleTypingStart = (data: unknown) => {
      const payload = data as {
        roomId?: string;
        userId?: string;
        userName?: string;
        startedAt?: string;
      };

      if (
        payload.roomId !== roomId ||
        payload.userId === currentUserId ||
        !payload.userId ||
        !payload.userName
      ) {
        return;
      }

      const userId = payload.userId;
      const userName = payload.userName;

      setTypingUsers((prev) => {
        const exists = prev.some((u) => u.userId === userId);
        if (exists) return prev;

        return [
          ...prev,
          {
            userId,
            userName,
            startedAt: payload.startedAt ?? new Date().toISOString(),
          },
        ];
      });
    };

    const handleTypingStop = (data: unknown) => {
      const payload = data as {
        roomId?: string;
        userId?: string;
      };

      if (payload.roomId !== roomId || !payload.userId) {
        return;
      }

      setTypingUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
    };

    realtimeClient.on('typing_start', handleTypingStart);
    realtimeClient.on('typing_stop', handleTypingStop);

    return () => {
      realtimeClient.off('typing_start', handleTypingStart);
      realtimeClient.off('typing_stop', handleTypingStop);
    };
  }, [realtimeClient, roomId, currentUserId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (isTypingRef.current) {
        emitTypingStop();
      }
    };
  }, [emitTypingStop]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
    handleInputChange,
    handleMessageSend,
  };
}
