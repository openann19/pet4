/**
 * Scroll-to-Bottom FAB "Magnetic" Effect Hook
 * 
 * Creates a premium scroll FAB animation with:
 * - Magnetic hover oscillation 0.5-1px at 0.7 Hz
 * - Entry: 180ms scale spring
 * - Badge increments with spring if new messages arrive
 * 
 * Location: apps/mobile/src/effects/chat/ui/use-scroll-fab-magnetic.ts
 */

import { useEffect } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  type SharedValue,
} from 'react-native-reanimated'
import { useReducedMotionSV, getReducedMotionDuration } from '../core/reduced-motion'
import { isTruthy, isDefined } from '@/core/guards';

/**
 * Spring configuration for entry
 */
const FAB_ENTRY_SPRING = {
  stiffness: 300,
  damping: 25,
  mass: 0.8,
}

/**
 * Scroll FAB magnetic effect options
 */
export interface UseScrollFabMagneticOptions {
  enabled?: boolean
  isVisible?: boolean
  badgeCount?: number
  previousBadgeCount?: number
}

/**
 * Scroll FAB magnetic effect return type
 */
export interface UseScrollFabMagneticReturn {
  scale: SharedValue<number>
  translateY: SharedValue<number>
  badgeScale: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  badgeAnimatedStyle: ReturnType<typeof useAnimatedStyle>
}

const DEFAULT_ENABLED = true
const DEFAULT_IS_VISIBLE = false
const OSCILLATION_FREQUENCY = 0.7 // Hz
const OSCILLATION_AMPLITUDE = 0.5 // px
const ENTRY_DURATION = 180 // ms

export function useScrollFabMagnetic(
  options: UseScrollFabMagneticOptions = {}
): UseScrollFabMagneticReturn {
  const {
    enabled = DEFAULT_ENABLED,
    isVisible = DEFAULT_IS_VISIBLE,
    badgeCount = 0,
    previousBadgeCount = 0,
  } = options

  const reducedMotion = useReducedMotionSV()
  const scale = useSharedValue(isVisible ? 1 : 0)
  const translateY = useSharedValue(0)
  const badgeScale = useSharedValue(1)

  // Entry animation
  useEffect(() => {
    if (enabled && isVisible) {
      const duration = getReducedMotionDuration(ENTRY_DURATION, reducedMotion.value)

      if (isTruthy(reducedMotion.value)) {
        scale.value = withTiming(1, {
          duration,
          easing: Easing.linear,
        })
      } else {
        scale.value = withSpring(1, FAB_ENTRY_SPRING)
      }
    } else if (enabled && !isVisible) {
      scale.value = withTiming(0, {
        duration: ENTRY_DURATION,
        easing: Easing.in(Easing.ease),
      })
    }
  }, [enabled, isVisible, reducedMotion, scale])

  // Magnetic hover oscillation
  useEffect(() => {
    if (enabled && isVisible && !reducedMotion.value) {
      const period = 1000 / OSCILLATION_FREQUENCY // ms

      translateY.value = withRepeat(
        withSequence(
          withTiming(OSCILLATION_AMPLITUDE, {
            duration: period / 2,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-OSCILLATION_AMPLITUDE, {
            duration: period / 2,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    } else {
      translateY.value = 0
    }
  }, [enabled, isVisible, reducedMotion, translateY])

  // Badge increment animation
  useEffect(() => {
    if (enabled && badgeCount > (previousBadgeCount ?? 0)) {
      badgeScale.value = withSequence(
        withSpring(1.3, FAB_ENTRY_SPRING),
        withSpring(1, FAB_ENTRY_SPRING)
      )
    }
  }, [enabled, badgeCount, previousBadgeCount, badgeScale])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    }
  })

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: badgeScale.value }],
    }
  })

  return {
    scale,
    translateY,
    badgeScale,
    animatedStyle,
    badgeAnimatedStyle,
  }
}

