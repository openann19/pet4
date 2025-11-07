/**
 * Web Adapter: useBubbleEntry
 * Optimized bubble entry animations for web platform
 */

'use client'

import { useBubbleEntry as useSharedBubbleEntry, type UseBubbleEntryOptions } from '@petspark/motion'

// Legacy compatibility types
export type BubbleDirection = 'incoming' | 'outgoing'

export interface WebBubbleEntryOptions extends Omit<UseBubbleEntryOptions, 'direction'> {
  /**
   * Enable GPU-accelerated transform3d for better performance on web
   * @default true
   */
  useGPUAcceleration?: boolean

  /**
   * Reduce motion based on prefers-reduced-motion CSS media query
   * @default true
   */
  respectCSSReducedMotion?: boolean

  // Legacy compatibility props
  direction?: BubbleDirection | UseBubbleEntryOptions['direction']
  enabled?: boolean
  isNew?: boolean
}

// Legacy compatibility interface
export interface UseBubbleEntryReturn {
  style: ReturnType<typeof useSharedBubbleEntry>['style']
  enter: () => void
  exit: () => void
  reset: () => void
  isVisible: boolean
  isAnimating: boolean
  // Legacy compatibility methods
  trigger: () => void
  animatedStyle: ReturnType<typeof useSharedBubbleEntry>['style']
}

const WEB_OPTIMIZED_DEFAULTS: Partial<UseBubbleEntryOptions> = {
  // Slightly faster animations for web (feels more responsive)
  entryDuration: 350,
  staggerDelay: 40,
  
  // Less distance for tighter UI feel on web
  distance: 24,
  
  // Reduced bounce effect for more professional web feel
  springConfig: {
    damping: 18,
    stiffness: 220,
    mass: 0.9
  }
}

/**
 * Web-optimized bubble entry hook with CSS reduced motion integration
 */
export function useBubbleEntry(options: WebBubbleEntryOptions = {}): UseBubbleEntryReturn {
  const {
    useGPUAcceleration = true,
    respectCSSReducedMotion = true,
    // Legacy compatibility props
    direction,
    enabled = true,
    isNew = true,
    ...sharedOptions
  } = options

  // Check CSS prefers-reduced-motion if enabled
  const cssReducedMotion = respectCSSReducedMotion && 
    typeof window !== 'undefined' && 
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  // Convert legacy direction to new direction prop
  const convertedDirection = direction === 'incoming' ? 'left' : direction === 'outgoing' ? 'right' : 'bottom'

  const webOptimizedConfig: UseBubbleEntryOptions = {
    ...WEB_OPTIMIZED_DEFAULTS,
    ...sharedOptions,
    direction: (sharedOptions as UseBubbleEntryOptions).direction || convertedDirection,
    autoTrigger: enabled && isNew,
    // Override reduced motion if CSS preference is set
    reducedMotion: cssReducedMotion || (sharedOptions as UseBubbleEntryOptions).reducedMotion || false
  }

  const result = useSharedBubbleEntry(webOptimizedConfig)

  // Add GPU acceleration hint to the animated style for web
  const enhancedStyle = useGPUAcceleration ? {
    ...result.style,
    // Add transform3d hint for GPU acceleration on web
    backfaceVisibility: 'hidden' as const,
    perspective: 1000,
  } : result.style

  return {
    ...result,
    style: enhancedStyle,
    // Legacy compatibility methods
    trigger: result.enter,
    animatedStyle: enhancedStyle
  }
}
