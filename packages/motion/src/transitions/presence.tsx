import React, { useEffect } from 'react'
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { motion } from '../tokens'
import { useReducedMotionSV, getReducedMotionDuration } from '../reduced-motion'
import { isTruthy } from '../utils/guards'

export interface PresenceProps {
  visible?: boolean
  mode?: 'wait' | 'sync' | 'popLayout' | (string & {})
  children: React.ReactNode
}

/**
 * Presence component for enter/exit animations.
 * Respects reduced motion preferences (instant transitions when enabled).
 */
export function Presence({ visible = true, children }: PresenceProps): JSX.Element {
  const reducedMotion = useReducedMotionSV()
  const a = useSharedValue(visible ? 1 : 0)

  useEffect(() => {
    if (isTruthy(reducedMotion.value)) {
      // Instant transition for reduced motion
      a.value = withTiming(visible ? 1 : 0, {
        duration: getReducedMotionDuration(120, true),
      })
    } else {
      a.value = withTiming(visible ? 1 : 0, { duration: motion.durations.md })
    }
  }, [visible, reducedMotion, a])

  const style = useAnimatedStyle(() => {
    if (isTruthy(reducedMotion.value)) {
      // Minimal transform for reduced motion
      return {
        opacity: a.value,
        scale: 0.99 + a.value * 0.01, // Very subtle scale
      }
    }
    return {
      opacity: a.value,
      y: (1 - a.value) * 12,
      scale: 0.98 + a.value * 0.02,
    }
  })

  return <Animated.View style={style}>{children}</Animated.View>
}

export interface UsePageTransitionsReturn {
  enter: () => void
  exit: () => void
  animatedStyle: ReturnType<typeof useAnimatedStyle>
}

/**
 * Hook for page transition animations.
 * Respects reduced motion preferences (instant transitions when enabled).
 */
export function usePageTransitions(): UsePageTransitionsReturn {
  const reducedMotion = useReducedMotionSV()
  const t = useSharedValue(0)

  const enter = (): void => {
    if (reducedMotion.value) {
      t.value = withTiming(1, { duration: getReducedMotionDuration(120, true) })
    } else {
      t.value = withSpring(1, motion.spring.smooth)
    }
  }

  const exit = (): void => {
    if (reducedMotion.value) {
      t.value = withTiming(0, { duration: getReducedMotionDuration(120, true) })
    } else {
      t.value = withTiming(0, { duration: motion.durations.sm })
    }
  }

  const animatedStyle = useAnimatedStyle(() => {
    if (reducedMotion.value) {
      return { opacity: t.value }
    }
    return {
      x: (1 - t.value) * 20,
      opacity: t.value,
    }
  })

  return { enter, exit, animatedStyle }
}
