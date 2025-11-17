/**
 * Reduced Motion SharedValue Hook
 *
 * Provides a Reanimated SharedValue for reduced motion preference.
 * Worklet-friendly for use in animations.
 *
 * Location: apps/mobile/src/effects/core/useReducedMotionSV.ts
 */

import { useEffect } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'
import { useSharedValue, type SharedValue } from 'react-native-reanimated'
import { createLogger } from '../../utils/logger'
import { isTruthy, isDefined } from '@petspark/shared';

const logger = createLogger('useReducedMotionSV')

/**
 * Hook to get reduced motion preference as a SharedValue
 *
 * Updates reactively when preference changes and can be used in worklets.
 *
 * @returns SharedValue<boolean> - true if reduced motion is enabled
 *
 * @example
 * ```typescript
 * const reducedMotion = useReducedMotionSV()
 *
 * const animatedStyle = useAnimatedStyle(() => {
 *   if (reducedMotion.value) {
 *     return { opacity: 1 } // Instant, no animation
 *   }
 *   return { opacity: withSpring(1) }
 * })
 * ```
 */
export function useReducedMotionSV(): SharedValue<boolean> {
  const sv = useSharedValue(false)

  useEffect(() => {
    let mounted = true

    // Initial check
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.isReduceMotionEnabled()
        .then(enabled => {
          if (mounted) {
            sv.value = enabled
          }
        })
        .catch(error => {
          logger.error('Failed to check reduced motion', error)
        })

      // Listen for changes
      const subscription = AccessibilityInfo.addEventListener?.(
        'reduceMotionChanged' as const,
        (enabled: boolean) => {
          if (isTruthy(mounted)) {
            sv.value = enabled
          }
        }
      )

      return () => {
        mounted = false
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove()
        }
      }
    }

    return () => {
      mounted = false
    }
  }, [sv])

  return sv
}
