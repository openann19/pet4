'use client'

import { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring, runOnUI, type SharedValue } from 'react-native-reanimated'
import { useCallback } from 'react'
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseUndoSendAnimationOptions {
  onComplete?: () => void
}

export interface UseUndoSendAnimationReturn {
  translateX: SharedValue<number>
  scale: SharedValue<number>
  opacity: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  animate: () => void
  reset: () => void
}

export function useUndoSendAnimation(
  options: UseUndoSendAnimationOptions = {}
): UseUndoSendAnimationReturn {
  const { onComplete } = options

  const translateX = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const animate = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-100, timingConfigs.fast),
      withTiming(-200, timingConfigs.smooth)
    )

    scale.value = withSequence(
      withSpring(0.8, springConfigs.smooth),
      withSpring(0.6, springConfigs.smooth)
    )

    opacity.value = withSequence(
      withTiming(0.7, timingConfigs.fast),
      withTiming(0, timingConfigs.smooth)
    )

    if (isTruthy(onComplete)) {
      setTimeout(() => {
        onComplete()
      }, 400)
    }
  }, [translateX, scale, opacity, onComplete])

  const reset = useCallback(() => {
    runOnUI(() => {
      translateX.value = 0
      scale.value = 1
      opacity.value = 1
    })()
  }, [translateX, scale, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value }
      ],
      opacity: opacity.value
    }
  })

  return {
    translateX,
    scale,
    opacity,
    animatedStyle,
    animate,
    reset
  }
}

