/**
 * Hook for handling story gestures: swipe, tap, long press, pinch-zoom
 * Optimized for 60fps performance
 */

import { useCallback, useRef, useState } from 'react'
import { haptics } from '@/lib/haptics'

interface GestureState {
  isSwiping: boolean
  swipeDistance: number
  isPinching: boolean
  pinchScale: number
  isLongPressing: boolean
}

interface UseStoryGesturesOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onTap?: () => void
  onLongPress?: () => void
  onPinchZoom?: (scale: number) => void
  enablePinchZoom?: boolean
  swipeThreshold?: number
  longPressDelay?: number
}

export function useStoryGestures(options: UseStoryGesturesOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onTap,
    onLongPress,
    onPinchZoom,
    enablePinchZoom = true,
    swipeThreshold = 50,
    longPressDelay = 500
  } = options

  const [gestureState, setGestureState] = useState<GestureState>({
    isSwiping: false,
    swipeDistance: 0,
    isPinching: false,
    pinchScale: 1,
    isLongPressing: false
  })

  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const startDistanceRef = useRef<number>(0)
  const longPressTimerRef = useRef<number | null>(null)
  const lastTapTimeRef = useRef<number>(0)
  const lastTapPosRef = useRef<{ x: number; y: number } | null>(null)
  const touchesRef = useRef<{ x: number; y: number }[]>([])

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setGestureState(prev => ({ ...prev, isLongPressing: false }))
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return

    const now = Date.now()
    const currentPos = { x: touch.clientX, y: touch.clientY }

    startPosRef.current = currentPos
    touchesRef.current = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))

    if (e.touches.length === 1) {
      const timeSinceLastTap = now - lastTapTimeRef.current
      const posDiff = lastTapPosRef.current
        ? Math.sqrt(
            Math.pow(currentPos.x - lastTapPosRef.current.x, 2) +
            Math.pow(currentPos.y - lastTapPosRef.current.y, 2)
          )
        : Infinity

      if (timeSinceLastTap < 300 && posDiff < 50) {
        onTap?.()
        lastTapTimeRef.current = 0
        return
      }

      longPressTimerRef.current = window.setTimeout(() => {
        setGestureState(prev => ({ ...prev, isLongPressing: true }))
        haptics.trigger('medium')
        onLongPress?.()
      }, longPressDelay)
    } else if (e.touches.length === 2 && enablePinchZoom) {
      cancelLongPress()
      const touches = Array.from(e.touches)
      if (touches.length < 2) return
      const [t1, t2] = touches
      if (!t1 || !t2) return
      const distance = Math.sqrt(
        Math.pow(t1.clientX - t2.clientX, 2) +
        Math.pow(t1.clientY - t2.clientY, 2)
      )
      startDistanceRef.current = distance
      setGestureState(prev => ({ ...prev, isPinching: true }))
    }
  }, [onTap, onLongPress, enablePinchZoom, longPressDelay, cancelLongPress])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPosRef.current) return

    cancelLongPress()

    if (e.touches.length === 1) {
      const touch = e.touches[0]
      if (!touch) return
      const deltaX = touch.clientX - startPosRef.current.x
      const deltaY = touch.clientY - startPosRef.current.y

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        setGestureState(prev => ({
          ...prev,
          isSwiping: true,
          swipeDistance: deltaX
        }))
      }
    } else if (e.touches.length === 2 && enablePinchZoom) {
      const touches = Array.from(e.touches)
      if (touches.length < 2) return
      const [t1, t2] = touches
      if (!t1 || !t2) return
      const distance = Math.sqrt(
        Math.pow(t1.clientX - t2.clientX, 2) +
        Math.pow(t1.clientY - t2.clientY, 2)
      )
      const scale = distance / startDistanceRef.current
      const clampedScale = Math.max(1, Math.min(scale, 3))
      setGestureState(prev => ({ ...prev, pinchScale: clampedScale }))
      onPinchZoom?.(clampedScale)
    }
  }, [enablePinchZoom, onPinchZoom, cancelLongPress])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    cancelLongPress()

    if (gestureState.isSwiping && startPosRef.current) {
      const touch = e.changedTouches[0]
      if (touch) {
        const deltaX = touch.clientX - startPosRef.current.x
        if (Math.abs(deltaX) > swipeThreshold) {
          if (deltaX > 0 && onSwipeRight) {
            haptics.trigger('light')
            onSwipeRight()
          } else if (deltaX < 0 && onSwipeLeft) {
            haptics.trigger('light')
            onSwipeLeft()
          }
        }
      }
    }

    const touch = e.changedTouches[0]
    if (touch && !gestureState.isSwiping && !gestureState.isPinching) {
      const now = Date.now()
      lastTapTimeRef.current = now
      lastTapPosRef.current = { x: touch.clientX, y: touch.clientY }
    }

    setGestureState({
      isSwiping: false,
      swipeDistance: 0,
      isPinching: false,
      pinchScale: 1,
      isLongPressing: false
    })
    startPosRef.current = null
    touchesRef.current = []
  }, [gestureState, swipeThreshold, onSwipeLeft, onSwipeRight, cancelLongPress])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    startPosRef.current = { x: e.clientX, y: e.clientY }

    longPressTimerRef.current = window.setTimeout(() => {
      setGestureState(prev => ({ ...prev, isLongPressing: true }))
      haptics.trigger('medium')
      onLongPress?.()
    }, longPressDelay)
  }, [onLongPress, longPressDelay])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!startPosRef.current) return
    cancelLongPress()

    const deltaX = e.clientX - startPosRef.current.x
    if (Math.abs(deltaX) > 10) {
      setGestureState(prev => ({
        ...prev,
        isSwiping: true,
        swipeDistance: deltaX
      }))
    }
  }, [cancelLongPress])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    cancelLongPress()

    if (gestureState.isSwiping && startPosRef.current) {
      const deltaX = e.clientX - startPosRef.current.x
      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0 && onSwipeRight) {
          haptics.trigger('light')
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          haptics.trigger('light')
          onSwipeLeft()
        }
      }
    }

    if (!gestureState.isSwiping && !gestureState.isPinching) {
      onTap?.()
    }

    setGestureState({
      isSwiping: false,
      swipeDistance: 0,
      isPinching: false,
      pinchScale: 1,
      isLongPressing: false
    })
    startPosRef.current = null
  }, [gestureState, swipeThreshold, onSwipeLeft, onSwipeRight, onTap, cancelLongPress])

  return {
    gestureState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp
    },
    reset: useCallback(() => {
      cancelLongPress()
      setGestureState({
        isSwiping: false,
        swipeDistance: 0,
        isPinching: false,
        pinchScale: 1,
        isLongPressing: false
      })
      startPosRef.current = null
    }, [cancelLongPress])
  }
}

