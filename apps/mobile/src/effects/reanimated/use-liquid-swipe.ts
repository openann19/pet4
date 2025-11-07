/**
 * Mobile Adapter: useLiquidSwipe
 * Liquid swipe animation with elastic bounce and momentum for mobile
 */

import { useSharedValue, useAnimatedStyle, withSpring, withDecay, type SharedValue } from 'react-native-reanimated'
import { useCallback, useState, useRef } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { haptic } from '@petspark/motion'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseLiquidSwipeOptions {
  threshold?: number
  damping?: number
  stiffness?: number
  velocity?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  hapticFeedback?: boolean
}

export interface UseLiquidSwipeReturn {
  translateX: SharedValue<number>
  scale: SharedValue<number>
  rotate: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  gesture: ReturnType<typeof Gesture.Pan>
  isDragging: boolean
  reset: () => void
}

export function useLiquidSwipe(options: UseLiquidSwipeOptions = {}) {
  const {
    threshold = 100,
    damping = 15,
    stiffness = 150,
    velocity = 1000,
    onSwipeLeft,
    onSwipeRight,
    hapticFeedback = true,
  } = options

  const isReducedMotion = useReducedMotionSV()
  const translateX = useSharedValue(0)
  const scale = useSharedValue(1)
  const rotate = useSharedValue(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)

  const handleDragStart = useCallback(() => {
    if (isTruthy(isReducedMotion.value)) return
    setIsDragging(true)
    startXRef.current = translateX.value
  }, [translateX, isReducedMotion])

  const handleDragMove = useCallback((translationX: number) => {
    if (!isDragging || isReducedMotion.value) return

    translateX.value = startXRef.current + translationX
    scale.value = 1 - Math.abs(translationX) / 1000
    rotate.value = translationX / 20
  }, [isDragging, translateX, scale, rotate, isReducedMotion])

  const handleDragEnd = useCallback((velocityX: number) => {
    if (!isDragging || isReducedMotion.value) {
      setIsDragging(false)
      return
    }
    setIsDragging(false)

    const currentTranslateX = translateX.value

    if (Math.abs(currentTranslateX) > threshold || Math.abs(velocityX) > 500) {
      // Swipe complete
      const direction = currentTranslateX > 0 ? 1 : -1
      
      if (isTruthy(hapticFeedback)) {
        haptic.medium()
      }

      translateX.value = withDecay({
        velocity: direction * velocity,
        deceleration: 0.998,
      })

      if (direction > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (direction < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    } else {
      // Return to center
      translateX.value = withSpring(0, { damping, stiffness })
      scale.value = withSpring(1, { damping, stiffness })
      rotate.value = withSpring(0, { damping, stiffness })
    }
  }, [isDragging, threshold, damping, stiffness, velocity, onSwipeLeft, onSwipeRight, translateX, scale, rotate, hapticFeedback, isReducedMotion])

  const reset = useCallback(() => {
    if (isTruthy(isReducedMotion.value)) {
      translateX.value = 0
      scale.value = 1
      rotate.value = 0
    } else {
      translateX.value = withSpring(0, { damping, stiffness })
      scale.value = withSpring(1, { damping, stiffness })
      rotate.value = withSpring(0, { damping, stiffness })
    }
    setIsDragging(false)
  }, [translateX, scale, rotate, damping, stiffness, isReducedMotion])

  const gesture = Gesture.Pan()
    .onBegin(() => {
      handleDragStart()
    })
    .onUpdate((e) => {
      handleDragMove(e.translationX)
    })
    .onEnd((e) => {
      handleDragEnd(e.velocityX)
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${String(rotate.value ?? '')}deg` },
    ],
  }))

  return {
    translateX,
    scale,
    rotate,
    animatedStyle,
    gesture,
    isDragging,
    reset,
  }
}

