import { Easing, type PetSparkEasingFunction } from './easing'

/**
 * Production Motion Tokens
 * Single source of truth for all animation durations, springs, and easings
 */

// Helper for easing functions that may not exist on web
const createPolyEasing = (power: number): PetSparkEasingFunction => {
  if (typeof Easing.poly === 'function') {
    // poly returns EasingFunction directly
    const result = Easing.poly(power)
    // Ensure we return an EasingFunction, not a factory
    if (typeof result === 'function') {
      return result as PetSparkEasingFunction
    }
  }
  // Fallback for web - create a simple cubic easing
  return Easing.cubic
}

export const motion = {
  // Durations (ms) - Aligned with global UX rules
  durations: {
    instant: 75, // Reduced motion fallback
    hoverPress: 100, // Hover/press micro-interactions (75-150ms range)
    fast: 150, // Quick feedback
    enterExit: 200, // Enter/exit transitions (150-300ms range)
    standard: 260, // Default transitions
    slow: 300, // Deliberate animations (150-300ms range)
    deliberate: 500, // Long transitions (only for non-core interactions)
    // Legacy aliases for backward compatibility
    ultraFast: 100,
    xs: 75,
    sm: 100,
    md: 200,
    lg: 300,
    xl: 500,
  },

  // Spring configurations - Critically damped for premium feel
  spring: {
    snappy: { stiffness: 280, damping: 22, mass: 1 }, // Quick, responsive
    smooth: { stiffness: 210, damping: 24, mass: 1 }, // Balanced, natural
    velvety: { stiffness: 160, damping: 26, mass: 1 }, // Soft, gentle
    // Legacy aliases
    soft: { stiffness: 140, damping: 16, mass: 1 },
    crisp: { stiffness: 320, damping: 28, mass: 1 },
  },

  // Easing curves (for timing animations)
  easing: {
    outQuint: Easing.out(createPolyEasing(5)),
    outExpo: Easing.out(Easing.exp),
    inOutCubic: Easing.inOut(Easing.cubic),
    // Legacy CSS curves (for web fallback)
    standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    emphasis: 'cubic-bezier(0.3, 0.7, 0, 1)',
  },
} as const
