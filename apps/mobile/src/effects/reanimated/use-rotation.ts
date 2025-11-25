import { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from '@petspark/motion'
import { useEffect } from 'react'
import type { AnimatedStyle } from './animated-view'

export interface UseRotationOptions {
  enabled?: boolean
  duration?: number
  repeat?: number | boolean
}

export interface UseRotationReturn {
  rotation: ReturnType<typeof useSharedValue<number>>
  rotationStyle: AnimatedStyle
}

/**
 * Hook for continuous rotation animation
 * Uses React Reanimated for smooth 60fps animations on UI thread
 */
export function useRotation(options: UseRotationOptions = {}): UseRotationReturn {
  const { enabled = true, duration = 1000, repeat = true } = options

  const rotation = useSharedValue(0)

  useEffect(() => {
    if (!enabled) {
      rotation.value = 0
      return
    }

    rotation.value = withRepeat(
      withTiming(360, { duration }),
      repeat === true ? -1 : repeat === false ? 0 : repeat,
      false
    )
  }, [enabled, duration, repeat, rotation])

  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    }
  }) as AnimatedStyle

  return {
    rotation,
    rotationStyle,
  }
}
