/**
 * Mobile Adapter: useBubbleEntry
 * Optimized bubble entry animations for mobile platform
 */

import { useBubbleEntry as useSharedBubbleEntry, type UseBubbleEntryOptions } from '@petspark/motion'

// Legacy compatibility types
export type BubbleDirection = 'incoming' | 'outgoing'

export interface MobileBubbleEntryOptions extends Omit<UseBubbleEntryOptions, 'direction'> {
  /**
   * Use native driver for better performance
   * @default true
   */
  useNativeDriver?: boolean

  /**
   * Optimize for screen reader accessibility
   * @default true
   */
  accessibilityOptimized?: boolean

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

const MOBILE_OPTIMIZED_DEFAULTS: Partial<UseBubbleEntryOptions> = {
  // Faster animations for mobile (more responsive feel)
  entryDuration: 300,
  staggerDelay: 30,
  
  // Larger distance for more dramatic effect on mobile
  distance: 36,
  
  // More pronounced bounce for touch interfaces
  springConfig: {
    damping: 12,
    stiffness: 180,
    mass: 1.1
  }
}

/**
 * Mobile-optimized bubble entry hook with accessibility and performance focus
 */
export function useBubbleEntry(options: MobileBubbleEntryOptions = {}): UseBubbleEntryReturn {
  const {
    useNativeDriver = true,
    accessibilityOptimized = true,
    // Legacy compatibility props
    direction,
    enabled = true,
    isNew = true,
    ...sharedOptions
  } = options

  // Convert legacy direction to new direction prop
  const convertedDirection = direction === 'incoming' ? 'left' : direction === 'outgoing' ? 'right' : 'bottom'

  const mobileOptimizedConfig: UseBubbleEntryOptions = {
    ...MOBILE_OPTIMIZED_DEFAULTS,
    ...sharedOptions,
    direction: (sharedOptions as UseBubbleEntryOptions).direction || convertedDirection,
    autoTrigger: enabled && isNew,
    // Enhanced spring config for mobile responsiveness
    springConfig: {
      ...MOBILE_OPTIMIZED_DEFAULTS.springConfig,
      ...(sharedOptions as UseBubbleEntryOptions).springConfig
    }
  }

  const result = useSharedBubbleEntry(mobileOptimizedConfig)

  // Enhanced style for mobile with native driver hints
  const enhancedStyle = useNativeDriver ? {
    ...result.style,
    // Hint for native driver optimization
    transform: result.style.transform || [
      { translateX: 0 },
      { translateY: 0 },
      { scale: 1 }
    ]
  } : result.style

  return {
    ...result,
    style: enhancedStyle,
    // Legacy compatibility methods
    trigger: result.enter,
    animatedStyle: enhancedStyle
  }
}

export type { UseBubbleEntryOptions } from '@petspark/motion'