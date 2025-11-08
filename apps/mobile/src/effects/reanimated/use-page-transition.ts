import { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated'
import { useEffect } from 'react'
import type { AnimatedStyle } from './animated-view'

export interface UsePageTransitionOptions {
  isVisible: boolean
  duration?: number
  delay?: number
  direction?: 'up' | 'down' | 'fade'
}

export interface UsePageTransitionReturn {
  opacity: ReturnType<typeof useSharedValue<number>>
  translateY: ReturnType<typeof useSharedValue<number>>
  scale: ReturnType<typeof useSharedValue<number>>
  style: AnimatedStyle
}

export function usePageTransition(options: UsePageTransitionOptions): UsePageTransitionReturn {
  const { isVisible, duration = 300, delay = 0, direction = 'up' } = options

  const opacity = useSharedValue(0)
  const translateY = useSharedValue(direction === 'up' ? 30 : direction === 'down' ? -30 : 0)
  const scale = useSharedValue(0.98)

  useEffect(() => {
    if (isVisible) {
      const delayMs = delay * 1000
      opacity.value = withDelay(delayMs, withTiming(1, { duration }))
      translateY.value = withDelay(delayMs, withTiming(0, { duration }))
      scale.value = withDelay(delayMs, withTiming(1, { duration }))
    } else {
      opacity.value = withTiming(0, { duration })
      translateY.value = withTiming(direction === 'up' ? -30 : 30, { duration })
      scale.value = withTiming(0.98, { duration })
    }
  }, [isVisible, duration, delay, direction, opacity, translateY, scale])

  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }
  }) as AnimatedStyle

  return {
    opacity,
    translateY,
    scale,
    style,
  }
}
