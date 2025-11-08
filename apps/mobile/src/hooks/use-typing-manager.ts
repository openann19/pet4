/**
 * Typing Manager Hook (Mobile)
 * Matches web implementation for parity
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { TypingUser } from '@/lib/chat-types'
// import type { RealtimeClient } from '@/lib/realtime' // TODO: Implement mobile realtime client

export interface UseTypingManagerOptions {
  roomId: string
  currentUserId: string
  currentUserName: string
  // realtimeClient?: RealtimeClient // TODO: Implement mobile realtime client
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
  roomId: _roomId,
  currentUserId: _currentUserId,
  currentUserName: _currentUserName,
  typingTimeout = DEFAULT_TYPING_TIMEOUT,
  debounceDelay = DEFAULT_DEBOUNCE_DELAY,
}: UseTypingManagerOptions): UseTypingManagerReturn {
  const [typingUsers, _setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // const lastTypingEmitRef = useRef<number>(0) // TODO: Implement mobile realtime client

  const emitTypingStart = useCallback(
    () => {
      // TODO: Implement mobile realtime client
      // if (!realtimeClient) return
      // ... realtime logic
    },
    [
      /* realtimeClient, roomId, currentUserId, currentUserName, debounceDelay */
    ]
  )

  const emitTypingStop = useCallback(
    () => {
      // TODO: Implement mobile realtime client
      // if (!realtimeClient) return
      // ... realtime logic
    },
    [
      /* realtimeClient, roomId, currentUserId */
    ]
  )

  const startTyping = useCallback(() => {
    if (isTyping) return

    setIsTyping(true)
    emitTypingStart()

    if (typingTimeoutRef.current) {
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = undefined
    }
  }, [isTyping, emitTypingStop])

  const handleInputChange = useCallback(
    (value: string) => {
      if (debounceTimeoutRef.current) {
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
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = undefined
    }
  }, [stopTyping])

  // TODO: Implement mobile realtime client for typing indicators
  // useEffect(() => {
  //   if (!realtimeClient) return
  //   ... realtime event handlers
  // }, [realtimeClient, roomId, currentUserId])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (debounceTimeoutRef.current) {
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
