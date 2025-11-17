/**
 * Mobile Adapter: useSwipeReply
 * Swipe-to-reply gesture for mobile using react-native-gesture-handler
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  type SharedValue
} from 'react-native-reanimated'
import { useCallback } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { haptic } from '@petspark/motion'
import { springConfigs, timingConfigs } from './transitions'
import { useReducedMotionSV } from '../../effects/core/use-reduced-motion-sv'
import { isTruthy, isDefined } from '@petspark/shared';

export interface UseSwipeReplyOptions {
  onReply?: () => void
  threshold?: number
  hapticFeedback?: boolean
  enabled?: boolean
}

export interface UseSwipeReplyReturn {
  translateX: SharedValue<number>
  opacity: SharedValue<number>
  previewOpacity: SharedValue<number>
  previewScale: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  previewStyle: ReturnType<typeof useAnimatedStyle>
  gesture: ReturnType<typeof Gesture.Pan>
  reset: () => void
}

const DEFAULT_THRESHOLD = 60
const DEFAULT_HAPTIC_FEEDBACK = true
const DEFAULT_ENABLED = true

export function useSwipeReply(
  options: UseSwipeReplyOptions = {}
): UseSwipeReplyReturn {
  const {
    onReply,
    threshold = DEFAULT_THRESHOLD,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    enabled = DEFAULT_ENABLED
  } = options

  const isReducedMotion = useReducedMotionSV()
  const translateX = useSharedValue(0)
  const opacity = useSharedValue(0)
  const previewOpacity = useSharedValue(0)
  const previewScale = useSharedValue(0.9)
  const hasTriggeredHaptic = useSharedValue(false)

  const handleGestureStart = useCallback(() => {
    if (!enabled || isReducedMotion.value) {
      return
    }
    hasTriggeredHaptic.value = false
  }, [enabled, hasTriggeredHaptic, isReducedMotion])

  const handleGestureUpdate = useCallback((translationX: number) => {
    if (!enabled || isReducedMotion.value) {
      return
    }

    const clampedX = Math.max(0, translationX)
    translateX.value = clampedX

    const progress = Math.min(clampedX / threshold, 1)
    opacity.value = interpolate(
      progress,
      [0, 1],
      [0, 0.3],
      Extrapolation.CLAMP
    )

    if (clampedX >= threshold && !hasTriggeredHaptic.value) {
      if (isTruthy(hapticFeedback)) {
        haptic.selection()
      }
      hasTriggeredHaptic.value = true
    }
  }, [enabled, threshold, hapticFeedback, translateX, opacity, hasTriggeredHaptic, isReducedMotion])

  const handleGestureEnd = useCallback((translationX: number, velocityX: number) => {
    if (!enabled || isReducedMotion.value) {
      return
    }

    const shouldCommit = translationX >= threshold || velocityX > 500

    if (isTruthy(shouldCommit)) {
      translateX.value = withSpring(threshold, springConfigs.smooth)
      opacity.value = withTiming(0.3, timingConfigs.fast)

      previewOpacity.value = withSpring(1, springConfigs.bouncy)
      previewScale.value = withSpring(1, springConfigs.bouncy)

      if (isTruthy(onReply)) {
        onReply()
      }

      setTimeout(() => {
        reset()
      }, 2000)
    } else {
      reset()
    }
  }, [enabled, threshold, onReply, translateX, opacity, previewOpacity, previewScale, isReducedMotion])

  const reset = useCallback(() => {
    if (isTruthy(isReducedMotion.value)) {
      translateX.value = 0
      opacity.value = 0
      previewOpacity.value = 0
      previewScale.value = 0.9
    } else {
      translateX.value = withSpring(0, springConfigs.smooth)
      opacity.value = withTiming(0, timingConfigs.fast)
      previewOpacity.value = withTiming(0, timingConfigs.fast)
      previewScale.value = withTiming(0.9, timingConfigs.fast)
    }
    hasTriggeredHaptic.value = false
  }, [translateX, opacity, previewOpacity, previewScale, hasTriggeredHaptic, isReducedMotion])

  const gesture = (() => {
    const g = Gesture.Pan()
      .enabled(enabled)
    // @ts-expect-error - activeOffsetX exists at runtime but types may be incomplete
    g.activeOffsetX(10)
    return g
      .onStart(() => {
        handleGestureStart()
      })
      .onUpdate((e: { translationX: number }) => {
        handleGestureUpdate(e.translationX)
      })
      .onEnd((e: { translationX: number; velocityX: number }) => {
        handleGestureEnd(e.translationX, e.velocityX)
      })
  })()

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value
    }
  })

  const previewStyle = useAnimatedStyle(() => {
    return {
      opacity: previewOpacity.value,
      transform: [{ scale: previewScale.value }]
    }
  })

  return {
    translateX,
    opacity,
    previewOpacity,
    previewScale,
    animatedStyle,
    previewStyle,
    gesture,
    reset
  }
}

