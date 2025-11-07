import { useState, useEffect, useRef, useCallback } from 'react'
import { isTruthy, isDefined } from '@/core/guards';

interface UseTypingIndicatorOptions {
  timeout?: number
}

export function useTypingIndicator({ timeout = 1000 }: UseTypingIndicatorOptions = {}) {
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<number | null>(null)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof e === 'string' ? e : e.target.value
    
    if (!isTyping && value.length > 0) {
      setIsTyping(true)
    }

    if (isTruthy(typingTimeoutRef.current)) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      setIsTyping(false)
    }, timeout)

    return value
  }, [isTyping, timeout])

  useEffect(() => {
    return () => {
      if (isTruthy(typingTimeoutRef.current)) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return {
    isTyping,
    handleInputChange,
  }
}

