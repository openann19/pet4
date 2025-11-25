/**
 * Reduced Motion Hook - Mobile UI Package
 *
 * Detects reduced motion preference for use in mobile UI components.
 * This is a simplified implementation for the ui-mobile package.
 */

import { useState, useEffect } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'

/**
 * Hook to detect if user prefers reduced motion
 * @returns boolean indicating if reduced motion is enabled
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    let mounted = true

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Check initial state
      AccessibilityInfo.isReduceMotionEnabled()
        .then(enabled => {
          if (mounted) {
            setReduced(enabled || false)
          }
        })
        .catch(() => {
          // Fail silently - default to false
          if (mounted) {
            setReduced(false)
          }
        })

      // Listen for changes
      const subscription = AccessibilityInfo.addEventListener?.(
        'reduceMotionChanged',
        (enabled: boolean) => {
          if (mounted) {
            setReduced(enabled || false)
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
  }, [])

  return reduced
}
