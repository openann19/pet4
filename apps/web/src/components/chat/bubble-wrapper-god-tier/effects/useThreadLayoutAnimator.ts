'use client'

import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring
} from 'react-native-reanimated'
import { useEffect, useState } from 'react'
import { timingConfigs } from '@/effects/reanimated/transitions'
import { springConfigs } from '@/effects/reanimated/transitions'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseThreadLayoutAnimatorOptions {
  isExpanded?: boolean
  enabled?: boolean
  staggerDelay?: number
}

export interface UseThreadLayoutAnimatorReturn {
  height: ReturnType<typeof useSharedValue<number>>
  opacity: ReturnType<typeof useSharedValue<number>>
  translateY: ReturnType<typeof useSharedValue<number>>
  containerStyle: ReturnType<typeof useAnimatedStyle>
  messageStyle: (index: number) => ReturnType<typeof useAnimatedStyle>
  expand: () => void
  collapse: () => void
}

const DEFAULT_ENABLED = true
const DEFAULT_STAGGER_DELAY = 50

export function useThreadLayoutAnimator(
  options: UseThreadLayoutAnimatorOptions = {}
): UseThreadLayoutAnimatorReturn {
  const {
    isExpanded = false,
    enabled = DEFAULT_ENABLED,
    staggerDelay = DEFAULT_STAGGER_DELAY
  } = options

  const height = useSharedValue(0)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(-20)
  const [messageOpacities] = useState(() => Array.from({ length: 10 }, () => useSharedValue(0)))
  const [messageTranslateYs] = useState(() => Array.from({ length: 10 }, () => useSharedValue(-10)))

  useEffect(() => {
    if (!enabled) {
      return
    }

    if (isTruthy(isExpanded)) {
      height.value = withSpring(1, springConfigs.smooth)
      opacity.value = withTiming(1, timingConfigs.smooth)
      translateY.value = withSpring(0, springConfigs.smooth)

      messageOpacities.forEach((opacity, index) => {
        opacity.value = withDelay(
          index * staggerDelay,
          withTiming(1, timingConfigs.smooth)
        )
      })

      messageTranslateYs.forEach((translateY, index) => {
        translateY.value = withDelay(
          index * staggerDelay,
          withSpring(0, springConfigs.smooth)
        )
      })
    } else {
      height.value = withTiming(0, timingConfigs.fast)
      opacity.value = withTiming(0, timingConfigs.fast)
      translateY.value = withTiming(-20, timingConfigs.fast)

      messageOpacities.forEach((opacity) => {
        opacity.value = withTiming(0, timingConfigs.fast)
      })

      messageTranslateYs.forEach((translateY) => {
        translateY.value = withTiming(-10, timingConfigs.fast)
      })
    }
  }, [isExpanded, enabled, staggerDelay, height, opacity, translateY, messageOpacities, messageTranslateYs])

  const expand = () => {
    height.value = withSpring(1, springConfigs.smooth)
    opacity.value = withTiming(1, timingConfigs.smooth)
    translateY.value = withSpring(0, springConfigs.smooth)
  }

  const collapse = () => {
    height.value = withTiming(0, timingConfigs.fast)
    opacity.value = withTiming(0, timingConfigs.fast)
    translateY.value = withTiming(-20, timingConfigs.fast)
  }

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
      overflow: 'hidden' as const
    }
  })

  const messageStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const opacity = messageOpacities[index]
      const translateY = messageTranslateYs[index]
      return {
        opacity: opacity?.value ?? 0,
        transform: [{ translateY: translateY?.value ?? -10 }]
      }
    })
  }

  return {
    height,
    opacity,
    translateY,
    containerStyle,
    messageStyle,
    expand,
    collapse
  }
}

