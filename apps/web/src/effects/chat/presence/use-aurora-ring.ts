/**
 * Presence "Aurora Ring" Effect Hook
 * 
 * Creates a subtle perimeter glow around avatar for active users:
 * - Animated ring with pulsing opacity
 * - Color based on status (online, away, busy)
 * - Reduced motion → static ring
 * 
 * Location: apps/web/src/effects/chat/presence/use-aurora-ring.ts
 */

import { useEffect } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '../core/reduced-motion'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { isTruthy, isDefined } from '@/core/guards';

/**
 * Presence status type
 */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline'

/**
 * Presence aurora ring effect options
 */
export interface UseAuroraRingOptions {
  enabled?: boolean
  status?: PresenceStatus
  size?: number
}

/**
 * Presence aurora ring effect return type
 */
export interface UseAuroraRingReturn {
  ringOpacity: SharedValue<number>
  ringScale: SharedValue<number>
  animatedStyle: AnimatedStyle
}

const DEFAULT_ENABLED = true
const DEFAULT_STATUS: PresenceStatus = 'online'
const DEFAULT_SIZE = 40 // px

/**
 * Status colors
 */
const STATUS_COLORS: Record<PresenceStatus, string> = {
  online: '#10B981', // green
  away: '#F59E0B', // amber
  busy: '#EF4444', // red
  offline: '#6B7280', // gray
}

export function useAuroraRing(
  options: UseAuroraRingOptions = {}
): UseAuroraRingReturn {
  const {
    enabled = DEFAULT_ENABLED,
    status = DEFAULT_STATUS,
    size = DEFAULT_SIZE,
  } = options

  const reducedMotion = useReducedMotionSV()
  const ringOpacity = useSharedValue(0)
  const ringScale = useSharedValue(1)

  useEffect(() => {
    if (!enabled || status === 'offline') {
      ringOpacity.value = 0
      return
    }

    const isReducedMotion = reducedMotion.value

    if (isTruthy(isReducedMotion)) {
      // Static ring for reduced motion
      ringOpacity.value = 0.6
      ringScale.value = 1.1
    } else {
      // Pulsing animation
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.4, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )

      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.15, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1.05, {
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      )
    }
  }, [enabled, status, reducedMotion, ringOpacity, ringScale])

  const animatedStyle = useAnimatedStyle(() => {
    const color = STATUS_COLORS[status] ?? STATUS_COLORS.online

    return {
      opacity: ringOpacity.value,
      transform: [{ scale: ringScale.value }],
      boxShadow: `0 0 ${String(size / 4 ?? '')}px ${String(color ?? '')}80, 0 0 ${String(size / 2 ?? '')}px ${String(color ?? '')}40`,
      borderColor: color,
      borderWidth: 2,
      borderRadius: '50%',
      width: size,
      height: size,
    }
  }) as AnimatedStyle

  return {
    ringOpacity,
    ringScale,
    animatedStyle,
  }
}

