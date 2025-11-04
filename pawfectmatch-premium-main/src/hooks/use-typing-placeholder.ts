'use client'

import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing, type SharedValue } from 'react-native-reanimated'
import { useEffect } from 'react'
import { timingConfigs } from '@/effects/reanimated/transitions'

export interface UseTypingPlaceholderOptions {
  enabled?: boolean
  barCount?: number
  barWidth?: number
  barHeight?: number
  animationDuration?: number
}

export interface UseTypingPlaceholderReturn {
  animatedStyles: ReturnType<typeof useAnimatedStyle>[]
  opacity: SharedValue<number>
  containerStyle: ReturnType<typeof useAnimatedStyle>
}

const DEFAULT_BAR_COUNT = 3
const DEFAULT_BAR_WIDTH = 4
const DEFAULT_BAR_HEIGHT = 32
const DEFAULT_ANIMATION_DURATION = 600

export function useTypingPlaceholder(
  options: UseTypingPlaceholderOptions = {}
): UseTypingPlaceholderReturn {
  const {
    enabled = true,
    barCount = DEFAULT_BAR_COUNT,
    barWidth = DEFAULT_BAR_WIDTH,
    barHeight = DEFAULT_BAR_HEIGHT,
    animationDuration = DEFAULT_ANIMATION_DURATION
  } = options

  const opacity = useSharedValue(0)
  const barScales = Array.from({ length: barCount }, () => useSharedValue(0.3))
  const barTranslateYs = Array.from({ length: barCount }, () => useSharedValue(0))

  useEffect(() => {
    if (enabled) {
      opacity.value = withTiming(1, timingConfigs.fast)

      barScales.forEach((scale, index) => {
        scale.value = withRepeat(
          withSequence(
            withDelay(
              index * (animationDuration / barCount / 2),
              withTiming(1, {
                duration: animationDuration / 2,
                easing: Easing.inOut(Easing.ease)
              })
            ),
            withTiming(0.3, {
              duration: animationDuration / 2,
              easing: Easing.inOut(Easing.ease)
            })
          ),
          -1,
          false
        )
      })

      barTranslateYs.forEach((translateY, index) => {
        translateY.value = withRepeat(
          withSequence(
            withDelay(
              index * (animationDuration / barCount / 2),
              withTiming(-4, {
                duration: animationDuration / 2,
                easing: Easing.inOut(Easing.ease)
              })
            ),
            withTiming(0, {
              duration: animationDuration / 2,
              easing: Easing.inOut(Easing.ease)
            })
          ),
          -1,
          false
        )
      })
    } else {
      opacity.value = withTiming(0, timingConfigs.fast)
      barScales.forEach((scale) => {
        scale.value = 0.3
      })
      barTranslateYs.forEach((translateY) => {
        translateY.value = 0
      })
    }
  }, [enabled, barCount, animationDuration, opacity, barScales, barTranslateYs])

  const animatedStyles = barScales.map((scale, index) => {
    return useAnimatedStyle(() => {
      return {
        transform: [
          { scaleY: scale.value },
          { translateY: barTranslateYs[index]?.value ?? 0 }
        ],
        width: barWidth,
        height: barHeight
      }
    })
  })

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value
    }
  })

  return {
    animatedStyles,
    opacity,
    containerStyle
  }
}

