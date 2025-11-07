import { useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, type SharedValue } from 'react-native-reanimated'
import { springConfigs, timingConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export interface UseEntryAnimationOptions {
  delay?: number
  duration?: number
  initialY?: number
  initialOpacity?: number
  initialScale?: number
  enabled?: boolean
}

export interface UseEntryAnimationReturn {
  animatedStyle: AnimatedStyle
  opacity: SharedValue<number>
  translateY: SharedValue<number>
  scale: SharedValue<number>
}

export function useEntryAnimation(options: UseEntryAnimationOptions = {}): UseEntryAnimationReturn {
  const {
    delay = 0,
    duration = timingConfigs.smooth.duration ?? 250,
    initialY = 20,
    initialOpacity = 0,
    initialScale = 0.95,
    enabled = true
  } = options

  const opacity = useSharedValue(enabled ? initialOpacity : 1)
  const translateY = useSharedValue(enabled ? initialY : 0)
  const scale = useSharedValue(enabled ? initialScale : 1)

  useEffect(() => {
    if (!enabled) {
      opacity.value = 1
      translateY.value = 0
      scale.value = 1
      return
    }

    const timeoutId = setTimeout(() => {
      opacity.value = withSpring(1, springConfigs.smooth)
      translateY.value = withSpring(0, springConfigs.smooth)
      scale.value = withSpring(1, springConfigs.smooth)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [delay, enabled, opacity, translateY, scale])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ]
    }
  }) as AnimatedStyle

  return {
    animatedStyle,
    opacity,
    translateY,
    scale
  }
}
