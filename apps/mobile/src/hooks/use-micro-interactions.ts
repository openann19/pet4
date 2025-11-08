import * as Haptics from 'expo-haptics'
import { useCallback } from 'react'
import type { AnimatedStyle } from 'react-native-reanimated'
import { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated'

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 250,
  mass: 0.9,
}

interface UseMicroInteractionsOptions {
  hapticFeedback?: boolean
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection'
  scaleAmount?: number
  enableBounce?: boolean
}

interface UseMicroInteractionsReturn {
  scale: ReturnType<typeof useSharedValue<number>>
  animatedStyle: AnimatedStyle
  handlePress: () => void
  handlePressIn: () => void
  handlePressOut: () => void
}

/**
 * Hook for micro-interactions with haptic feedback and animations
 * Provides press animations with haptic feedback
 */
export function useMicroInteractions(
  options: UseMicroInteractionsOptions = {}
): UseMicroInteractionsReturn {
  const {
    hapticFeedback = true,
    hapticType = 'light',
    scaleAmount = 0.95,
    enableBounce = true,
  } = options

  const scale = useSharedValue(1)

  const handlePress = useCallback((): void => {
    if (hapticFeedback) {
      const hapticStyle =
        hapticType === 'light'
          ? Haptics.ImpactFeedbackStyle.Light
          : hapticType === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : hapticType === 'heavy'
              ? Haptics.ImpactFeedbackStyle.Heavy
              : Haptics.ImpactFeedbackStyle.Light

      void Haptics.impactAsync(hapticStyle)
    }

    if (enableBounce) {
      scale.value = withSequence(
        withSpring(scaleAmount, SPRING_CONFIG),
        withSpring(1, SPRING_CONFIG)
      )
    } else {
      scale.value = withSpring(scaleAmount, SPRING_CONFIG)
    }
  }, [hapticFeedback, hapticType, scaleAmount, enableBounce, scale])

  const handlePressIn = useCallback((): void => {
    scale.value = withSpring(scaleAmount, SPRING_CONFIG)
    if (hapticFeedback && hapticType === 'selection') {
      void Haptics.selectionAsync()
    }
  }, [scale, scaleAmount, hapticFeedback, hapticType])

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
