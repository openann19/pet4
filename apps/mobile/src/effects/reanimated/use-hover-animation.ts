import { useCallback } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { springConfigs, timingConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export interface UseHoverAnimationOptions {
  scale?: number
  duration?: number
  enabled?: boolean
  hapticFeedback?: boolean
}

export interface UseHoverAnimationReturn {
  scale: SharedValue<number>
  animatedStyle: AnimatedStyle
  handlePressIn: () => void
  handlePressOut: () => void
}

export function useHoverAnimation(options: UseHoverAnimationOptions = {}): UseHoverAnimationReturn {
  const {
    scale: hoverScale = 1.02,
    duration = timingConfigs.fast.duration ?? 150,
    enabled = true,
    hapticFeedback = false,
  } = options

  const scale = useSharedValue(1)
  const isPressed = useSharedValue(0)

  const handlePressIn = useCallback(() => {
    if (!enabled) return
    if (hapticFeedback) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    isPressed.value = 1
    scale.value = withTiming(hoverScale, { duration: duration / 2 })
  }, [enabled, hoverScale, duration, isPressed, scale, hapticFeedback])

  const handlePressOut = useCallback(() => {
    if (!enabled) return
    isPressed.value = 0
    scale.value = withSpring(1, springConfigs.smooth)
  }, [enabled, isPressed, scale])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    }
  }) as AnimatedStyle

  return {
    scale,
    animatedStyle,
    handlePressIn,
    handlePressOut,
  }
}
