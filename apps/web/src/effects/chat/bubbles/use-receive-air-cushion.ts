/**
 * Receive "Air-Cushion" Effect Hook
 * 
 * Creates a premium receive animation with:
 * - Spring scale animation (0.98→1.0, stiffness 280, damping 20, 180-220ms)
 * - Soft drop shadow animation (0→4dp over 120ms)
 * - No haptic by default (respect quiet inbox), optional Light on mentions
 * 
 * Location: apps/web/src/effects/chat/bubbles/use-receive-air-cushion.ts
 */

import { useCallback, useEffect } from 'react'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useReducedMotionSV, getReducedMotionDuration } from '../core/reduced-motion'
import { triggerHaptic } from '../core/haptic-manager'
import { logEffectStart, logEffectEnd } from '../core/telemetry'
import { randomRange } from '../core/seeded-rng'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { isTruthy, isDefined } from '@/core/guards';

/**
 * Spring configuration for air-cushion effect
 * Stiffness: 280, Damping: 20 (under-damped)
 */
const AIR_CUSHION_SPRING = {
  stiffness: 280,
  damping: 20,
  mass: 1.0,
}

/**
 * Receive air-cushion effect options
 */
export interface UseReceiveAirCushionOptions {
  enabled?: boolean
  isNew?: boolean
  isMention?: boolean
  onComplete?: () => void
}

/**
 * Receive air-cushion effect return type
 */
export interface UseReceiveAirCushionReturn {
  scale: SharedValue<number>
  shadowOpacity: SharedValue<number>
  shadowRadius: SharedValue<number>
  animatedStyle: AnimatedStyle
  trigger: () => void
}

const DEFAULT_ENABLED = true
const DEFAULT_IS_NEW = true
const SCALE_DURATION_MIN = 180 // ms
const SCALE_DURATION_MAX = 220 // ms
const SHADOW_DURATION = 120 // ms
const SHADOW_MAX_RADIUS = 4 // px

export function useReceiveAirCushion(
  options: UseReceiveAirCushionOptions = {}
): UseReceiveAirCushionReturn {
  const {
    enabled = DEFAULT_ENABLED,
    isNew = DEFAULT_IS_NEW,
    isMention = false,
    onComplete,
  } = options

  const reducedMotion = useReducedMotionSV()
  const scale = useSharedValue(isNew && enabled ? 0.98 : 1.0)
  const shadowOpacity = useSharedValue(0)
  const shadowRadius = useSharedValue(0)

  const trigger = useCallback(() => {
    if (!enabled || !isNew) {
      return
    }

    const isReducedMotion = reducedMotion.value
    const scaleDuration = isReducedMotion
      ? getReducedMotionDuration(SCALE_DURATION_MIN, true)
      : SCALE_DURATION_MIN + randomRange(0, SCALE_DURATION_MAX - SCALE_DURATION_MIN)

    // Log effect start
    const effectId = logEffectStart('receive-air-cushion', {
      reducedMotion: isReducedMotion,
      isMention,
    })

    // Scale animation (0.98 → 1.0)
    if (isTruthy(isReducedMotion)) {
      // Instant scale for reduced motion
      scale.value = withTiming(1.0, {
        duration: getReducedMotionDuration(SCALE_DURATION_MIN, true),
        easing: (t) => t, // linear
      })
    } else {
      scale.value = withSpring(1.0, AIR_CUSHION_SPRING)
    }

    // Shadow animation (0 → 4px)
    const shadowDuration = getReducedMotionDuration(SHADOW_DURATION, isReducedMotion)

    shadowOpacity.value = withTiming(1.0, {
      duration: shadowDuration,
      easing: (t) => t, // linear
    })

    shadowRadius.value = withTiming(SHADOW_MAX_RADIUS, {
      duration: shadowDuration,
      easing: (t) => t, // linear
    })

    // Haptic feedback (only on mentions)
    if (isTruthy(isMention)) {
      triggerHaptic('light')
    }

    // Call onComplete
    if (isTruthy(onComplete)) {
      setTimeout(() => {
        onComplete()
      }, scaleDuration)
    }

    // Log effect end
    setTimeout(() => {
      logEffectEnd(effectId, {
        durationMs: scaleDuration,
        success: true,
      })
    }, scaleDuration)
  }, [
    enabled,
    isNew,
    isMention,
    reducedMotion,
    scale,
    shadowOpacity,
    shadowRadius,
    onComplete,
  ])

  useEffect(() => {
    if (enabled && isNew) {
      trigger()
    }
  }, [enabled, isNew, trigger])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      boxShadow: `0 ${String(shadowRadius.value ?? '')}px ${String(shadowRadius.value * 2 ?? '')}px rgba(0, 0, 0, ${String(shadowOpacity.value * 0.2 ?? '')})`,
    }
  }) as AnimatedStyle

  return {
    scale,
    shadowOpacity,
    shadowRadius,
    animatedStyle,
    trigger,
  }
}

