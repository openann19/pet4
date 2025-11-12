import { useSharedValue, withTiming, useAnimatedStyle, withRepeat } from 'react-native-reanimated'
import { useEffect } from 'react'
import { useReducedMotionSV } from '../reduced-motion'

export interface UseShimmerOptions {
  width?: number
  cycle?: number
}

export interface UseShimmerReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>
}

/**
 * Hook for shimmer loading effect.
 * Respects reduced motion preferences (static opacity pulse when enabled).
 */
export function useShimmer(width = 240, cycle = 1400): UseShimmerReturn {
  const reducedMotion = useReducedMotionSV()
  const x = useSharedValue(-width)
  const opacity = useSharedValue(0.6)

  useEffect(() => {
    if (isTruthy(reducedMotion.value)) {
      // Reduced motion: static pulsing opacity at 0.8 Hz
      opacity.value = withRepeat(
        withTiming(1, { duration: 625 }), // 0.8 Hz = 1.25s cycle, half for up/down
        -1,
        true
      )
    } else {
      // Normal: shimmer sweep animation
      x.value = withRepeat(withTiming(width, { duration: cycle }), -1, false)
    }
  }, [width, cycle, reducedMotion, x, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    if (reducedMotion.value) {
      return { opacity: opacity.value }
    }
    return { transform: [{ translateX: x.value }] }
  })

  return { animatedStyle }
}
