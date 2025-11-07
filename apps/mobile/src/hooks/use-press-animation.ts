import * as Haptics from 'expo-haptics'
import { useCallback } from 'react'
import type { AnimatedStyle } from 'react-native-reanimated'
import { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated'
import { isTruthy, isDefined } from '@/core/guards';

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 250,
  mass: 0.9,
}

interface UsePressAnimationOptions {
  scaleAmount?: number
  hapticFeedback?: boolean
  hapticStyle?: Haptics.ImpactFeedbackStyle
  enableBounce?: boolean
}

interface UsePressAnimationReturn {
  scale: ReturnType<typeof useSharedValue<number>>
  animatedStyle: AnimatedStyle
  handlePress: () => void
  handlePressIn: () => void
  handlePressOut: () => void
}

/**
 * Hook for press animations with haptic feedback
 * Provides consistent press interactions across the app
 */
export function usePressAnimation(
  options: UsePressAnimationOptions = {}
): UsePressAnimationReturn {
  const {
    scaleAmount = 0.95,
    hapticFeedback = true,
    hapticStyle = Haptics.ImpactFeedbackStyle.Light,
    enableBounce = true,
  } = options

  const scale = useSharedValue(1)

  const handlePress = useCallback((): void => {
    if (isTruthy(hapticFeedback)) {
      void Haptics.impactAsync(hapticStyle)
    }

    if (isTruthy(enableBounce)) {
      scale.value = withSequence(
        withSpring(scaleAmount, SPRING_CONFIG),
        withSpring(1, SPRING_CONFIG)
      )
    } else {
      scale.value = withSpring(scaleAmount, SPRING_CONFIG)
    }
  }, [scale, scaleAmount, hapticFeedback, hapticStyle, enableBounce])

  const handlePressIn = useCallback((): void => {
    scale.value = withSpring(scaleAmount, SPRING_CONFIG)
  }, [scale, scaleAmount])

  const handlePressOut = useCallback((): void => {
    scale.value = withSpring(1, SPRING_CONFIG)
  }, [scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  })) as AnimatedStyle

  return {
    scale,
    animatedStyle,
    handlePress,
    handlePressIn,
    handlePressOut,
  }
}

