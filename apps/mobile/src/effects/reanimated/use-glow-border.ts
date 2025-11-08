/**
 * Animated Glow Border for React Native
 * Pulsating glow effect using shadow properties
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import type { AnimatedStyle } from './animated-view'

export interface UseGlowBorderOptions {
  color?: string
  intensity?: number
  speed?: number
  enabled?: boolean
  pulseSize?: number
}

export interface UseGlowBorderReturn {
  animatedStyle: AnimatedStyle
  progress: ReturnType<typeof useSharedValue<number>>
}

export function useGlowBorder(options: UseGlowBorderOptions = {}): UseGlowBorderReturn {
  const {
    color = 'rgba(99, 102, 241, 0.8)',
    intensity = 20,
    speed = 2000,
    enabled = true,
    pulseSize: _pulseSize = 8,
  } = options

  const progress = useSharedValue(0)

  useEffect(() => {
    if (enabled) {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: speed, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: speed, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    } else {
      progress.value = 0
    }
  }, [enabled, speed, progress])

  const animatedStyle = useAnimatedStyle(() => {
    const glowIntensity = interpolate(progress.value, [0, 0.5, 1], [0, intensity, 0])
    const shadowOpacity = interpolate(progress.value, [0, 0.5, 1], [0.3, 0.8, 0.3])

    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: shadowOpacity,
      shadowRadius: glowIntensity,
      elevation: glowIntensity,
    }
  }) as AnimatedStyle

  return {
    animatedStyle,
    progress,
  }
}
