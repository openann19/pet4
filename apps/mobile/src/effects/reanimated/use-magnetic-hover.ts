/**
 * Mobile Adapter: useMagneticHover
 * Magnetic hover effect adapted for mobile (press gesture with haptics)
 */

import { useSharedValue, useAnimatedStyle, withSpring, type SharedValue } from 'react-native-reanimated'
import { Gesture } from 'react-native-gesture-handler'
import { useCallback, useRef } from 'react'
import { haptic } from '@petspark/motion'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'
import { isTruthy, isDefined } from '@petspark/shared';

export interface UseMagneticHoverOptions {
  strength?: number
  damping?: number
  stiffness?: number
  maxDistance?: number
  enabled?: boolean
  hapticFeedback?: boolean
}

export interface UseMagneticHoverReturn {
  translateX: SharedValue<number>
  translateY: SharedValue<number>
  scale: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  gesture: ReturnType<typeof Gesture.Pan>
}

export function useMagneticHover(options: UseMagneticHoverOptions = {}) {
  const {
    strength = 0.3,
    damping = 20,
    stiffness = 150,
    maxDistance = 50,
    enabled = true,
    hapticFeedback = true,
  } = options

  const isReducedMotion = useReducedMotionSV()
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)
  const containerDimensions = useRef<{ width: number; height: number }>({ width: 200, height: 200 })

  const handlePressIn = useCallback(() => {
    if (!enabled || isReducedMotion.value) return
    if (isTruthy(hapticFeedback)) {
      haptic.light()
    }
    scale.value = withSpring(1.05, { damping, stiffness })
  }, [enabled, damping, stiffness, scale, hapticFeedback, isReducedMotion])

  const handlePressOut = useCallback(() => {
    if (!enabled || isReducedMotion.value) return
    translateX.value = withSpring(0, { damping, stiffness })
    translateY.value = withSpring(0, { damping, stiffness })
    scale.value = withSpring(1, { damping, stiffness })
  }, [enabled, damping, stiffness, translateX, translateY, scale, isReducedMotion])

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .onBegin(() => {
      handlePressIn()
    })
    .onUpdate((e) => {
      if (!enabled || isReducedMotion.value) return
      const { width, height } = containerDimensions.current
      const centerX = width / 2
      const centerY = height / 2
      
      const deltaX = e.x - centerX
      const deltaY = e.y - centerY
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const maxDist = Math.min(width, height) / 2
      
      if (distance < maxDist) {
        const normalizedX = Math.max(-maxDistance, Math.min(maxDistance, deltaX * strength))
        const normalizedY = Math.max(-maxDistance, Math.min(maxDistance, deltaY * strength))
        
        translateX.value = withSpring(normalizedX, { damping, stiffness })
        translateY.value = withSpring(normalizedY, { damping, stiffness })
      }
    })
    .onEnd(() => {
      handlePressOut()
    })
    .onFinalize(() => {
      handlePressOut()
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  return {
    translateX,
    translateY,
    scale,
    animatedStyle,
    gesture,
  }
}

