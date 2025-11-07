'use client'

import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface UseShimmerSweepOptions {
  duration?: number
  delay?: number
  opacityRange?: [number, number]
  /** measured container width in px */
  width: number
  /** pause animation (e.g., reduced-motion) */
  paused?: boolean
  easing?: (value: number) => number
}

export interface UseShimmerSweepReturn {
  x: ReturnType<typeof useSharedValue<number>>
  opacity: ReturnType<typeof useSharedValue<number>>
  animatedStyle: AnimatedStyle
}

export function useShimmerSweep(options: UseShimmerSweepOptions): UseShimmerSweepReturn {
  const {
    duration = 3000,
    delay = 0,
    opacityRange = [0, 0.5],
    width,
    paused = false,
    easing = Easing.inOut(Easing.quad),
  } = options

  const [minOpacity, maxOpacity] = opacityRange
  const initialWidth = Math.max(width, 0)

  const x = useSharedValue<number>(-initialWidth)
  const opacity = useSharedValue<number>(minOpacity)

  useEffect(() => {
    const sweepWidth = Math.max(width, 0)

    const start = () => {
      if (sweepWidth <= 0) {
        return
      }

      x.value = withRepeat(
        withSequence(
          withTiming(-sweepWidth, { duration: 0 }),
          withTiming(sweepWidth, { duration, easing })
        ),
        -1,
        false
      )

      opacity.value = withRepeat(
        withSequence(
          withTiming(minOpacity, { duration: Math.max(0, delay) }),
          withTiming(maxOpacity, { duration: duration * 0.5 }),
          withTiming(minOpacity, { duration: duration * 0.5 })
        ),
        -1,
        false
      )
    }

    const stop = () => {
      cancelAnimation(x)
      cancelAnimation(opacity)
      x.value = -sweepWidth
      opacity.value = minOpacity
    }

    if (paused || sweepWidth <= 0) {
      stop()
      return stop
    }

    start()
    return stop
  }, [delay, duration, easing, maxOpacity, minOpacity, paused, width, x, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${String(x.value ?? '')}px` }],
      opacity: opacity.value
    }
  }) as AnimatedStyle

  return {
    x,
    opacity,
    animatedStyle,
  }
}

