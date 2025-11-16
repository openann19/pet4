/**
 * Shared Wave Animation Hooks
 * Provides flowing wave effects for decorative/background elements.
 * Platform-agnostic, reduced-motion aware, and performance-friendly.
 */

import { useEffect } from 'react'
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate, type SharedValue } from 'react-native-reanimated'

// Type helper for transform arrays to avoid React Native type strictness
type TransformArray = any[]
import { useReducedMotionSV } from '../reduced-motion'

export interface UseWaveAnimationOptions {
  amplitude?: number
  frequency?: number
  /** total time (ms) for one full cycle 0 -> 1 */
  speed?: number
  direction?: 'horizontal' | 'vertical'
  enabled?: boolean
}

export interface UseWaveAnimationReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  progress: SharedValue<number>
}

export function useWaveAnimation(options: UseWaveAnimationOptions = {}): UseWaveAnimationReturn {
  const {
    amplitude = 20,
    frequency = 2,
    speed = 3000,
    direction = 'horizontal',
    enabled = true,
  } = options

  const reduced = useReducedMotionSV()
  const progress = useSharedValue(0)

  useEffect(() => {
    const linear = (t: number): number => t
    if (!enabled) {
      progress.value = 0
      return
    }

    // When reduced motion is enabled, we still advance time but keep amplitude 0
    progress.value = withRepeat(
      withTiming(1, { duration: speed, easing: linear }),
      -1,
      false
    )
  }, [enabled, speed, progress])

  const animatedStyle = useAnimatedStyle(() => {
    const phase = progress.value * Math.PI * 2 * frequency
    const amp = reduced.value ? 0 : amplitude
    const wave = Math.sin(phase) * amp

    return direction === 'horizontal'
      ? { transform: [{ translateX: wave }] as TransformArray }
      : { transform: [{ translateY: wave }] as TransformArray }
  })

  return { animatedStyle, progress }
}

/**
 * Multiple overlapped waves with different phase shifts/opacities.
 */
export function useMultiWave(waveCount: number = 3) {
  const progress = useSharedValue(0)
  const reduced = useReducedMotionSV()

  useEffect(() => {
    const linear = (t: number): number => t
    progress.value = withRepeat(
      withTiming(1, { duration: 4000, easing: linear }),
      -1,
      false
    )
  }, [progress])

  const useWaveStyle = (waveIndex: number, amplitude: number = 15) => {
    return useAnimatedStyle(() => {
      const phaseOffset = (waveIndex * Math.PI * 2) / Math.max(1, waveCount)
      const phase = progress.value * Math.PI * 2 + phaseOffset
      const amp = reduced.value ? 0 : amplitude
      const wave = Math.sin(phase) * amp
      const opacity = interpolate(progress.value, [0, 0.5, 1], [0.3, 0.6, 0.3])

      return {
        transform: [{ translateY: wave }, { translateX: wave * 0.5 }] as TransformArray,
        opacity,
      }
    })
  }

  // Preserve API while using a properly named hook internally
  const createWaveStyle = useWaveStyle

  return { createWaveStyle, progress }
}

// Back-compat type names exposed via package root
export type WaveAnimationOptions = UseWaveAnimationOptions
export type WaveAnimationReturn = UseWaveAnimationReturn
