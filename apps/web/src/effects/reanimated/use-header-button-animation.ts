'use client'

import { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay } from 'react-native-reanimated'
import { useEffect } from 'react'
import { springConfigs } from '@/effects/reanimated/transitions'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface UseHeaderButtonAnimationOptions {
  delay?: number
  scale?: number
  translateY?: number
  rotation?: number
}

export interface UseHeaderButtonAnimationReturn {
  opacity: ReturnType<typeof useSharedValue<number>>
  scale: ReturnType<typeof useSharedValue<number>>
  translateY: ReturnType<typeof useSharedValue<number>>
  rotation: ReturnType<typeof useSharedValue<number>>
  hoverScale: ReturnType<typeof useSharedValue<number>>
  hoverY: ReturnType<typeof useSharedValue<number>>
  hoverRotation: ReturnType<typeof useSharedValue<number>>
  buttonStyle: AnimatedStyle
  handleEnter: () => void
  handleLeave: () => void
  handleTap: () => void
}

export function useHeaderButtonAnimation(
  options: UseHeaderButtonAnimationOptions = {}
): UseHeaderButtonAnimationReturn {
  const {
    delay = 0,
    scale: hoverScaleValue = 1.12,
    translateY: hoverYValue = -3,
    rotation: hoverRotationValue = -5
  } = options

  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const translateY = useSharedValue(0)
  const rotation = useSharedValue(0)
  const hoverScale = useSharedValue(1)
  const hoverY = useSharedValue(0)
  const hoverRotation = useSharedValue(0)

  useEffect(() => {
    const delayMs = delay * 1000
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 400 }))
    scale.value = withDelay(delayMs, withSpring(1, springConfigs.smooth))
  }, [delay, opacity, scale])

  const handleEnter = () => {
    hoverScale.value = withSpring(hoverScaleValue, springConfigs.smooth)
    hoverY.value = withSpring(hoverYValue, springConfigs.smooth)
    hoverRotation.value = withSpring(hoverRotationValue, springConfigs.smooth)
  }

  const handleLeave = () => {
    hoverScale.value = withSpring(1, springConfigs.smooth)
    hoverY.value = withSpring(0, springConfigs.smooth)
    hoverRotation.value = withSpring(0, springConfigs.smooth)
  }

  const handleTap = () => {
    hoverScale.value = withSpring(0.9, springConfigs.smooth)
    setTimeout(() => {
      hoverScale.value = withSpring(1, springConfigs.smooth)
    }, 150)
  }

  const buttonStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value * hoverScale.value },
        { translateY: translateY.value + hoverY.value },
        { rotate: `${String(rotation.value + hoverRotation.value ?? '')}deg` }
      ]
    }
  }) as AnimatedStyle

  return {
    opacity,
    scale,
    translateY,
    rotation,
    hoverScale,
    hoverY,
    hoverRotation,
    buttonStyle,
    handleEnter,
    handleLeave,
    handleTap
  }
}

