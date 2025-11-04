import { useState, useCallback } from 'react'
import type { PanInfo } from 'framer-motion';
import { useMotionValue, useTransform } from 'framer-motion'
import { haptics } from '@/lib/haptics'

interface UseSwipeOptions {
  onSwipe?: (direction: 'left' | 'right') => void
  swipeThreshold?: number
  swipeVelocity?: number
  hapticFeedback?: boolean
}

export function useSwipe({
  onSwipe,
  swipeThreshold = 150,
  swipeVelocity = 500,
  hapticFeedback = true,
}: UseSwipeOptions = {}) {
  const [isDragging, setIsDragging] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-30, 0, 30])
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0])
  const likeOpacity = useTransform(x, [0, 150], [0, 1])
  const passOpacity = useTransform(x, [-150, 0], [1, 0])

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    if (hapticFeedback) {
      haptics.trigger('selection')
    }
  }, [hapticFeedback])

  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80
    const currentX = info.offset.x
    
    if (hapticFeedback && Math.abs(currentX) > threshold && Math.abs(currentX) < threshold + 20) {
      haptics.trigger('light')
    }
  }, [hapticFeedback])

  const handleDragEnd = useCallback((
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false)
    
    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > swipeVelocity) {
      const action = info.offset.x > 0 ? 'right' : 'left'
      setDirection(action)
      
      if (hapticFeedback) {
        haptics.trigger(action === 'right' ? 'success' : 'light')
      }
      
      onSwipe?.(action)
      
      // Reset after animation
      setTimeout(() => {
        x.set(0)
        setDirection(null)
      }, 300)
    } else {
      x.set(0)
      if (hapticFeedback) {
        haptics.trigger('light')
      }
    }
  }, [swipeThreshold, swipeVelocity, hapticFeedback, onSwipe, x])

  const handleSwipe = useCallback((action: 'left' | 'right') => {
    setDirection(action)
    if (hapticFeedback) {
      haptics.trigger(action === 'right' ? 'success' : 'light')
    }
    onSwipe?.(action)
    
    // Reset after animation
    setTimeout(() => {
      x.set(0)
      setDirection(null)
    }, 300)
  }, [hapticFeedback, onSwipe, x])

  const reset = useCallback(() => {
    x.set(0)
    setDirection(null)
    setIsDragging(false)
  }, [x])

  return {
    x,
    rotate,
    opacity,
    likeOpacity,
    passOpacity,
    isDragging,
    direction,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    handleSwipe,
    reset,
  }
}

