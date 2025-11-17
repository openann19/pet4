import { useSharedValue, withSpring, withTiming, useAnimatedStyle } from 'react-native-reanimated'
import { motion } from '../tokens'
import { useCallback } from 'react'
import { useReducedMotionSV, getReducedMotionDuration } from '../reduced-motion'
import { isTruthy } from '../utils/guards'

export interface UsePressBounceOptions {
  scaleOnPress?: number
  scaleOnRelease?: number
  reducedMotion?: boolean
}

export interface UsePressBounceReturn {
  scale: ReturnType<typeof useSharedValue<number>>
  onPressIn: () => void
  onPressOut: () => void
  animatedStyle: ReturnType<typeof useAnimatedStyle>
}

/**
 * Hook for bounce-on-tap animation.
 * Respects reduced motion preferences (instant animation when enabled).
 */
export function usePressBounce(scaleOnPress = 0.96, scaleOnRelease = 1): UsePressBounceReturn {
  const reducedMotion = useReducedMotionSV()
  const s = useSharedValue(scaleOnRelease)

  const onPressIn = useCallback(() => {
    if (isTruthy(reducedMotion.value)) {
      // Instant animation for reduced motion
      s.value = withTiming(scaleOnPress, { duration: getReducedMotionDuration(120, true) })
    } else {
      s.value = withSpring(scaleOnPress, motion.spring.crisp)
    }
  }, [scaleOnPress, reducedMotion, s])

  const onPressOut = useCallback(() => {
    if (isTruthy(reducedMotion.value)) {
      // Instant animation for reduced motion
      s.value = withTiming(scaleOnRelease, { duration: getReducedMotionDuration(120, true) })
    } else {
      s.value = withSpring(scaleOnRelease, motion.spring.smooth)
    }
  }, [scaleOnRelease, reducedMotion, s])

  const animatedStyle = useAnimatedStyle(() => ({
    scale: s.value,
  }))

  return { scale: s, onPressIn, onPressOut, animatedStyle }
}
