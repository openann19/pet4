'use client'

import type { RefObject } from 'react'
import { useCallback, useRef, useState } from 'react'
import { isTruthy, isDefined } from '@petspark/shared';

export interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
  preventDefault?: boolean
}

export interface UseSwipeGestureReturn {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: (e: React.MouseEvent) => void
  }
  isSwiping: boolean
  swipeDistance: number
  ref: RefObject<HTMLElement | null>
}

export function useSwipeGesture(options: UseSwipeGestureOptions = {}): UseSwipeGestureReturn {
  const { onSwipeLeft, onSwipeRight, threshold = 50, preventDefault = true } = options

  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  const handleStart = useCallback((clientX: number, clientY: number): void => {
    startXRef.current = clientX
    startYRef.current = clientY
    setIsSwiping(true)
    setSwipeDistance(0)
  }, [])

  const handleMove = useCallback((clientX: number, clientY: number): void => {
    if (startXRef.current === null || startYRef.current === null) {
      return
    }

    const deltaX = clientX - startXRef.current
    const deltaY = clientY - startYRef.current

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setSwipeDistance(deltaX)
    }
  }, [])

  const handleEnd = useCallback(
    (clientX: number): void => {
      if (startXRef.current === null) {
        return
      }

      const deltaX = clientX - startXRef.current
      const absDeltaX = Math.abs(deltaX)

      if (absDeltaX >= threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }

      startXRef.current = null
      startYRef.current = null
      setIsSwiping(false)
      setSwipeDistance(0)
    },
    [threshold, onSwipeLeft, onSwipeRight]
  )

  const onTouchStart = useCallback(
    (e: React.TouchEvent): void => {
      if (preventDefault) {
        e.preventDefault()
      }
      const touch = e.touches[0]
      if (touch) {
        handleStart(touch.clientX, touch.clientY)
      }
    },
    [handleStart, preventDefault]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent): void => {
      if (preventDefault) {
        e.preventDefault()
      }
      const touch = e.touches[0]
      if (touch) {
        handleMove(touch.clientX, touch.clientY)
      }
    },
    [handleMove, preventDefault]
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent): void => {
      if (preventDefault) {
        e.preventDefault()
      }
      const touch = e.changedTouches[0]
      if (touch) {
        handleEnd(touch.clientX)
      }
    },
    [handleEnd, preventDefault]
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent): void => {
      if (preventDefault) {
        e.preventDefault()
      }
      handleStart(e.clientX, e.clientY)
    },
    [handleStart, preventDefault]
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent): void => {
      if (preventDefault) {
        e.preventDefault()
      }
      if (startXRef.current !== null) {
        handleMove(e.clientX, e.clientY)
      }
    },
    [handleMove, preventDefault]
  )

  const onMouseUp = useCallback(
    (e: React.MouseEvent): void => {
      if (preventDefault) {
        e.preventDefault()
      }
      if (startXRef.current !== null) {
        handleEnd(e.clientX)
      }
    },
    [handleEnd, preventDefault]
  )

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
    },
    isSwiping,
    swipeDistance,
    ref: elementRef,
  }
}
