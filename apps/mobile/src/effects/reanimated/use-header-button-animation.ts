import { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay } from '@petspark/motion'
import { useCallback, useEffect } from 'react'
import { springConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'
import * as Haptics from 'expo-haptics'

export interface UseHeaderButtonAnimationOptions {
  delay?: number
  scale?: number
  translateY?: number
  rotation?: number
  hapticFeedback?: boolean
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
  handlePressIn: () => void
  handlePressOut: () => void
}

export function useHeaderButtonAnimation(
  options: UseHeaderButtonAnimationOptions = {}
): UseHeaderButtonAnimationReturn {
  const {
    delay = 0,
    scale: hoverScaleValue = 1.12,
    translateY: hoverYValue = -3,
    rotation: hoverRotationValue = -5,
    hapticFeedback = false,
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

  const handleEnter = useCallback(() => {
    hoverScale.value = withSpring(hoverScaleValue, springConfigs.smooth)
    hoverY.value = withSpring(hoverYValue, springConfigs.smooth)
    hoverRotation.value = withSpring(hoverRotationValue, springConfigs.smooth)
  }, [hoverScale, hoverY, hoverRotation, hoverScaleValue, hoverYValue, hoverRotationValue])

  const handleLeave = useCallback(() => {
    hoverScale.value = withSpring(1, springConfigs.smooth)
    hoverY.value = withSpring(0, springConfigs.smooth)
    hoverRotation.value = withSpring(0, springConfigs.smooth)
  }, [hoverScale, hoverY, hoverRotation])

  const handleTap = useCallback(() => {
    if (hapticFeedback) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    hoverScale.value = withSpring(0.9, springConfigs.smooth)
    setTimeout(() => {
      hoverScale.value = withSpring(1, springConfigs.smooth)
    }, 150)
  }, [hapticFeedback, hoverScale])

  const handlePressIn = useCallback(() => {
    if (hapticFeedback) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    hoverScale.value = withSpring(hoverScaleValue, springConfigs.smooth)
    hoverY.value = withSpring(hoverYValue, springConfigs.smooth)
  }, [hapticFeedback, hoverScale, hoverY, hoverScaleValue, hoverYValue])

  const handlePressOut = useCallback(() => {
    hoverScale.value = withSpring(1, springConfigs.smooth)
    hoverY.value = withSpring(0, springConfigs.smooth)
    hoverRotation.value = withSpring(0, springConfigs.smooth)
  }, [hoverScale, hoverY, hoverRotation])

  const buttonStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value * hoverScale.value },
        { translateY: translateY.value + hoverY.value },
        { rotate: `${rotation.value + hoverRotation.value}deg` },
      ],
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
    handleTap,
    handlePressIn,
    handlePressOut,
  }
}
