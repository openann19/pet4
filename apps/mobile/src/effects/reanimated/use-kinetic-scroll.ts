/**
 * Mobile Adapter: useKineticScroll
 * Momentum-based scrolling with decay physics for mobile
 */

import { useSharedValue, useAnimatedStyle, withDecay, cancelAnimation, type SharedValue } from 'react-native-reanimated'
import { useCallback, useState, useRef } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

export interface UseKineticScrollOptions {
  damping?: number
  velocityMultiplier?: number
  clamp?: [number, number]
  enabled?: boolean
}

export interface UseKineticScrollReturn {
  offset: SharedValue<number>
  velocity: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  gesture: ReturnType<typeof Gesture.Pan>
  isDragging: boolean
  reset: () => void
}

export function useKineticScroll(options: UseKineticScrollOptions = {}) {
  const {
    damping = 0.998,
    velocityMultiplier = 1,
    clamp,
    enabled = true,
  } = options

  const isReducedMotion = useReducedMotionSV()
  const offset = useSharedValue(0)
  const velocity = useSharedValue(0)
  const [isDragging, setIsDragging] = useState(false)
  const lastPosition = useRef(0)
  const lastTime = useRef(0)

  const handleDragStart = useCallback(() => {
    if (!enabled || isReducedMotion.value) return
    cancelAnimation(offset)
    setIsDragging(true)
    lastTime.current = Date.now()
    velocity.value = 0
  }, [enabled, offset, velocity, isReducedMotion])

  const handleDragMove = useCallback((translationY: number) => {
    if (!enabled || !isDragging || isReducedMotion.value) return

    const currentTime = Date.now()
    const deltaY = translationY - lastPosition.current
    const deltaTime = currentTime - lastTime.current

    if (deltaTime > 0) {
      velocity.value = (deltaY / deltaTime) * velocityMultiplier
    }

    offset.value = translationY

    if (isTruthy(clamp)) {
      offset.value = Math.max(clamp[0], Math.min(clamp[1], offset.value))
    }

    lastPosition.current = translationY
    lastTime.current = currentTime
  }, [isDragging, velocityMultiplier, clamp, offset, velocity, enabled, isReducedMotion])

  const handleDragEnd = useCallback(() => {
    if (!enabled || !isDragging || isReducedMotion.value) return
    setIsDragging(false)

    if (isTruthy(isReducedMotion.value)) {
      offset.value = 0
      velocity.value = 0
      return
    }

    const decayConfig = clamp !== undefined 
      ? { velocity: velocity.value, deceleration: damping, rubberBandEffect: true as const, clamp }
      : { velocity: velocity.value, deceleration: damping }
    
    offset.value = withDecay(decayConfig)
  }, [isDragging, damping, clamp, velocity, offset, enabled, isReducedMotion])

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onBegin(() => {
      handleDragStart()
    })
    .onUpdate((e) => {
      handleDragMove(e.translationY)
    })
    .onEnd(() => {
      handleDragEnd()
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }))

  const reset = useCallback(() => {
    cancelAnimation(offset)
    offset.value = 0
    velocity.value = 0
    setIsDragging(false)
  }, [offset, velocity])

  return {
    offset,
    velocity,
    animatedStyle,
    gesture,
    isDragging,
    reset,
  }
}

