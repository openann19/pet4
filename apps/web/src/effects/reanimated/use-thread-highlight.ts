'use client'

import { useThreadHighlight as useThreadHighlightBase } from '@petspark/motion'
import type { UseThreadHighlightOptions as BaseOptions, UseThreadHighlightReturn } from '@petspark/motion'

// Legacy interface for backwards compatibility
export interface UseThreadHighlightOptions extends BaseOptions {
  isThreadMessage?: boolean
  previewDelay?: number
  enabled?: boolean
  
  // Legacy properties mapped to new options
  highlightDuration?: number
}

// Extended return type for web-specific features
export interface UseThreadHighlightWebReturn extends UseThreadHighlightReturn {
  // Legacy methods for backwards compatibility
  trigger: () => void
  dismiss: () => void
}

/**
 * Web-specific thread highlight hook
 * Provides backwards compatibility while leveraging the new shared architecture
 */
export function useThreadHighlight(
  options: UseThreadHighlightOptions = {}
): UseThreadHighlightWebReturn {
  const {
    isThreadMessage = false,
    highlightDuration = 2000,
    previewDelay = 300,
    enabled = true,
    highlightColor = '#3B82F6', // Web blue color
    glowRadius = 12, // Larger glow for web
    enablePulse = false,
    autoDismissAfter = highlightDuration,
    ...rest
  } = options

  // Map legacy options to new shared hook
  const baseResult = useThreadHighlightBase({
    highlightColor,
    glowRadius,
    highlightDuration: 250, // Web-optimized speed
    enablePulse,
    autoDismissAfter: enabled && isThreadMessage ? autoDismissAfter : 0,
    springConfig: {
      damping: 18,
      stiffness: 200,
      mass: 1
    },
    ...rest
  })

  // Legacy API compatibility
  const trigger = () => {
    if (enabled && isThreadMessage) {
      baseResult.highlight()
    }
  }

  const dismiss = () => {
    baseResult.unhighlight()
  }

  return {
    ...baseResult,
    trigger,
    dismiss,
  }
}
