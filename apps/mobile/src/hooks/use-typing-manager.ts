/**
 * Typing Manager Hook (Mobile)
 * Matches web implementation for parity
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { TypingUser } from '@/lib/chat-types'
import type { RealtimeClient } from '@/lib/realtime'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseTypingManagerOptions {
  roomId: string
  currentUserId: string
  currentUserName: string
  realtimeClient?: RealtimeClient
  typingTimeout?: number
  debounceDelay?: number
}

export interface UseTypingManagerReturn {
  typingUsers: TypingUser[]
  isTyping: boolean
  startTyping: () => void
  stopTyping: () => void
  handleInputChange: (value: string) => void
  handleMessageSend: () => void
}

const DEFAULT_TYPING_TIMEOUT = 3000
const DEFAULT_DEBOUNCE_DELAY = 500

export function useTypingManager({
  roomId,
  currentUserId,
  currentUserName,
  realtimeClient,
  typingTimeout = DEFAULT_TYPING_TIMEOUT,
  debounceDelay = DEFAULT_DEBOUNCE_DELAY,
}: UseTypingManagerOptions): UseTypingManagerReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const debounceTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined)
  const lastTypingEmitRef = useRef<number>(0)

  const emitTypingStart = useCallback(() => {
    if (!realtimeClient) return

    const now = Date.now()
    if (now - lastTypingEmitRef.current < debounceDelay) {
      return
    }

    lastTypingEmitRef.current = now

    realtimeClient
      .emit('typing_start', {
        roomId,
        userId: currentUserId,
        userName: currentUserName,
      })
      .catch(() => {
        // Silent fail for typing events
      })
  }, [realtimeClient, roomId, currentUserId, currentUserName, debounceDelay])

  const emitTypingStop = useCallback(() => {
    if (!realtimeClient) return

    realtimeClient
      .emit('typing_stop', {
        roomId,
        userId: currentUserId,
      })
      .catch(() => {
        // Silent fail for typing events
      })
  }, [realtimeClient, roomId, currentUserId])

  const startTyping = useCallback(() => {
    if (isTruthy(isTyping)) return

    setIsTyping(true)
    emitTypingStart()

    if (isTruthy(typingTimeoutRef.current)) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, typingTimeout)
  }, [isTyping, typingTimeout, emitTypingStart])

  const stopTyping = useCallback(() => {
    if (!isTyping) return

    setIsTyping(false)
    emitTypingStop()

    if (isTruthy(typingTimeoutRef.current)) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = undefined
    }
  }, [isTyping, emitTypingStop])

  const handleInputChange = useCallback(
    (value: string) => {
      if (isTruthy(debounceTimeoutRef.current)) {
        clearTimeout(debounceTimeoutRef.current)
      }

      if (value.trim().length > 0) {
        startTyping()
      } else {
        debounceTimeoutRef.current = setTimeout(() => {
          stopTyping()
        }, debounceDelay)
      }
    },
    [startTyping, stopTyping, debounceDelay]
  )

  const handleMessageSend = useCallback(() => {
    stopTyping()
    if (isTruthy(debounceTimeoutRef.current)) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = undefined
    }
  }, [stopTyping])

  useEffect(() => {
    if (!realtimeClient) return

    const handleTypingStart = (data: {
      roomId: string
      userId: string
      userName: string
    }): void => {
      if (data.roomId !== roomId || data.userId === currentUserId) return

      setTypingUsers((prev) => {
        const existing = prev.find((u) => u.userId === data.userId)
        if (isTruthy(existing)) return prev

        return [
          ...prev,
          {
            userId: data.userId,
            userName: data.userName,
            startedAt: new Date().toISOString(),
          },
        ]
      })
    }

    const handleTypingStop = (data: {
      roomId: string
      userId: string
    }): void => {
      if (data.roomId !== roomId || data.userId === currentUserId) return

      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
    }

    realtimeClient.on('typing_start', handleTypingStart)
    realtimeClient.on('typing_stop', handleTypingStop)

    return () => {
      realtimeClient.off('typing_start', handleTypingStart)
      realtimeClient.off('typing_stop', handleTypingStop)
    }
  }, [realtimeClient, roomId, currentUserId])

  useEffect(() => {
    return () => {
      if (isTruthy(typingTimeoutRef.current)) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTruthy(debounceTimeoutRef.current)) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
    handleInputChange,
    handleMessageSend,
  }
}
