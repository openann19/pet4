'use strict'

import { useThreadHighlight as useThreadHighlightBase } from '@petspark/motion'
import type { UseThreadHighlightOptions, UseThreadHighlightReturn } from '@petspark/motion'
import { Platform } from 'react-native'
import { isTruthy, isDefined } from '@/core/guards';

interface MobileThreadHighlightOptions extends UseThreadHighlightOptions {
  /**
   * Use native shadow for better performance on mobile
   * @default true
   */
  useNativeShadow?: boolean

  /**
   * Enable haptic feedback on highlight
   * @default true
   */
  enableHaptic?: boolean

  /**
   * Optimize for thread context in chat
   * @default false
   */
  isThreadMessage?: boolean
}

/**
 * Mobile-specific thread highlight hook
 * Optimized for touch interactions and mobile performance
 */
export function useThreadHighlight(
  options: MobileThreadHighlightOptions = {}
): UseThreadHighlightReturn {
  const {
    useNativeShadow = true,
    enableHaptic = true,
    isThreadMessage = false,
    highlightColor = '#4F46E5',
    glowRadius = 6, // Smaller on mobile for performance
    enablePulse = false, // Disabled by default on mobile
    autoDismissAfter = isThreadMessage ? 3000 : 0, // Auto-dismiss threads
    ...rest
  } = options

  // Mobile-optimized configuration
  const mobileConfig = {
    highlightColor,
    glowRadius,
    highlightDuration: 200, // Faster on mobile
    enablePulse,
    autoDismissAfter,
    springConfig: {
      damping: 20, // More damped for touch
      stiffness: 180,
      mass: 1.2, // Slightly heavier feel
    },
    ...rest
  }

  const result = useThreadHighlightBase(mobileConfig)

  // Override highlight method to add haptic feedback
  const originalHighlight = result.highlight
  const highlight = () => {
    if (enableHaptic && Platform.OS !== 'web') {
      // Add haptic feedback here when available
      // import { HapticFeedback } from 'react-native-haptic-feedback'
      // HapticFeedback.impact(HapticFeedback.ImpactFeedbackStyle.Light)
    }
    originalHighlight()
  }

  // Optimize style for mobile native shadow
  if (isTruthy(useNativeShadow)) {
    const originalStyle = result.style
    return {
      ...result,
      highlight,
      style: {
        ...originalStyle,
        // Mobile-specific shadow optimization
        elevation: 4, // Android
        shadowColor: highlightColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: glowRadius,
      }
    }
  }

  return {
    ...result,
    highlight,
  }
}

// Re-export types for convenience
export type { UseThreadHighlightOptions, UseThreadHighlightReturn }