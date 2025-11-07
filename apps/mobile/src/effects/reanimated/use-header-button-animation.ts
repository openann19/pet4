import { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, type SharedValue } from 'react-native-reanimated'
import { useEffect, useCallback } from 'react'
import { springConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export interface UseHeaderButtonAnimationOptions {
  delay?: number
  scale?: number
  translateY?: number
  rotation?: number
}

export interface UseHeaderButtonAnimationReturn {
  opacity: SharedValue<number>
  scale: SharedValue<number>
  translateY: SharedValue<number>
  rotation: SharedValue<number>
  pressScale: SharedValue<number>
  pressY: SharedValue<number>
  pressRotation: SharedValue<number>
  buttonStyle: AnimatedStyle
  handlePressIn: () => void
  handlePressOut: () => void
  handleTap: () => void
}

export function useHeaderButtonAnimation(
  options: UseHeaderButtonAnimationOptions = {}
): UseHeaderButtonAnimationReturn {
  const {
    delay = 0,
    scale: pressScaleValue = 1.12,
    translateY: pressYValue = -3,
    rotation: pressRotationValue = -5
  } = options

  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const translateY = useSharedValue(0)
  const rotation = useSharedValue(0)
  const pressScale = useSharedValue(1)
  const pressY = useSharedValue(0)
  const pressRotation = useSharedValue(0)

  useEffect(() => {
    const delayMs = delay * 1000
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 400 }))
    scale.value = withDelay(delayMs, withSpring(1, springConfigs.smooth))
  }, [delay, opacity, scale])

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(pressScaleValue, springConfigs.smooth)
    pressY.value = withSpring(pressYValue, springConfigs.smooth)
    pressRotation.value = withSpring(pressRotationValue, springConfigs.smooth)
  }, [pressScale, pressY, pressRotation, pressScaleValue, pressYValue, pressRotationValue])

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, springConfigs.smooth)
    pressY.value = withSpring(0, springConfigs.smooth)
    pressRotation.value = withSpring(0, springConfigs.smooth)
  }, [pressScale, pressY, pressRotation])

  const handleTap = useCallback(() => {
    pressScale.value = withSpring(0.9, springConfigs.smooth)
    setTimeout(() => {
      pressScale.value = withSpring(1, springConfigs.smooth)
    }, 150)
  }, [pressScale])

  const buttonStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value * pressScale.value },
        { translateY: translateY.value + pressY.value },
        { rotate: `${String(rotation.value + pressRotation.value ?? '')}deg` }
      ]
    }
  }) as AnimatedStyle

  return {
    opacity,
    scale,
    translateY,
    rotation,
    pressScale,
    pressY,
    pressRotation,
    buttonStyle,
    handlePressIn,
    handlePressOut,
    handleTap
  }
}
