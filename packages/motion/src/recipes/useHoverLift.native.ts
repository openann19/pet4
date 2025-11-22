import { useEffect } from 'react'
import { useSharedValue, withSpring, withTiming, useAnimatedStyle } from 'react-native-reanimated'

// Type helper for transform arrays to avoid React Native type strictness
type TransformArray = any[]
import { motion } from '../tokens'
import { useReducedMotionSV, getReducedMotionDuration } from '../reduced-motion'
import { isTruthy } from '../utils/guards'

const isWeb = typeof window !== 'undefined' && 'onmouseover' in window

export interface UseHoverLiftOptions {
  px?: number
  scale?: number
}

export interface UseHoverLiftReturn {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  animatedStyle: ReturnType<typeof useAnimatedStyle>
}

/**
 * Hook for hover lift effect (web only, gracefully no-ops on mobile).
 * Respects reduced motion preferences (instant animation when enabled).
 */
export function useHoverLift(px = 8, scale = 1.03): UseHoverLiftReturn {
  const reducedMotion = useReducedMotionSV()
  const y = useSharedValue(0)
  const s = useSharedValue(1)

  const enter = () => {
    if (isTruthy(reducedMotion.value)) {
      // Instant animation for reduced motion
      y.value = withTiming(-px, { duration: getReducedMotionDuration(120, true) })
      s.value = withTiming(scale, { duration: getReducedMotionDuration(120, true) })
    } else {
      y.value = withSpring(-px, motion.spring.soft)
      s.value = withSpring(scale, motion.spring.soft)
    }
  }

  const leave = () => {
    if (isTruthy(reducedMotion.value)) {
      // Instant animation for reduced motion
      y.value = withTiming(0, { duration: getReducedMotionDuration(120, true) })
      s.value = withTiming(1, { duration: getReducedMotionDuration(120, true) })
    } else {
      y.value = withSpring(0, motion.spring.smooth)
      s.value = withSpring(1, motion.spring.smooth)
    }
  }

  useEffect(() => {
    if (!isWeb) return
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: s.value }] as TransformArray,
  }))

  if (isWeb) {
    return {
      onMouseEnter: enter,
      onMouseLeave: leave,
      animatedStyle,
    }
  }

  return {
    animatedStyle,
  }
}
