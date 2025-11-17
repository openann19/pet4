import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import { springConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'
import { isTruthy } from '@petspark/shared';

export interface UseModalAnimationOptions {
  isVisible: boolean
  duration?: number
  delay?: number
}

export interface UseModalAnimationReturn {
  opacity: ReturnType<typeof useSharedValue<number>>
  scale: ReturnType<typeof useSharedValue<number>>
  y: ReturnType<typeof useSharedValue<number>>
  style: AnimatedStyle
}

export function useModalAnimation(options: UseModalAnimationOptions): UseModalAnimationReturn {
  const { isVisible, duration = 300, delay = 0 } = options

  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.9)
  const y = useSharedValue(20)

  useEffect(() => {
    if (isTruthy(isVisible)) {
      const delayMs = delay * 1000
      opacity.value = withDelay(delayMs, withTiming(1, { duration }))
      scale.value = withSpring(1, springConfigs.smooth)
      y.value = withSpring(0, springConfigs.smooth)
    } else {
      opacity.value = withTiming(0, { duration })
      scale.value = withTiming(0.9, { duration })
      y.value = withTiming(20, { duration })
    }
  }, [isVisible, duration, delay, opacity, scale, y])

  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { translateY: y.value }],
    }
  }) as AnimatedStyle

  return {
    opacity,
    scale,
    y,
    style,
  }
}
