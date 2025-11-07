'use client'

import { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated'
import { useEffect, useState } from 'react'
import { springConfigs } from '@/effects/reanimated/transitions'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface UsePageTransitionWrapperOptions {
  key: string
  duration?: number
  direction?: 'up' | 'down' | 'fade'
}

export interface UsePageTransitionWrapperReturn {
  opacity: ReturnType<typeof useSharedValue<number>>
  translateY: ReturnType<typeof useSharedValue<number>>
  scale: ReturnType<typeof useSharedValue<number>>
  style: AnimatedStyle
  isVisible: boolean
}

export function usePageTransitionWrapper(
  options: UsePageTransitionWrapperOptions
): UsePageTransitionWrapperReturn {
  const {
    key,
    duration = 300,
    direction = 'up'
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(direction === 'up' ? 30 : direction === 'down' ? -30 : 0)
  const scale = useSharedValue(0.98)

  useEffect(() => {
    setIsVisible(true)
    opacity.value = withTiming(1, { duration })
    translateY.value = withSpring(0, springConfigs.smooth)
    scale.value = withSpring(1, springConfigs.smooth)

    return () => {
      opacity.value = withTiming(0, { duration: duration * 0.5 })
      translateY.value = withTiming(direction === 'up' ? -30 : 30, { duration: duration * 0.5 })
      scale.value = withTiming(0.98, { duration: duration * 0.5 })
      setIsVisible(false)
    }
  }, [key, duration, direction, opacity, translateY, scale])

  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ]
    }
  }) as AnimatedStyle

  return {
    opacity,
    translateY,
    scale,
    style,
    isVisible
  }
}

