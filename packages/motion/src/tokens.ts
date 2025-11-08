import { Easing } from 'react-native-reanimated'

/**
 * Production Motion Tokens
 * Single source of truth for all animation durations, springs, and easings
 */

export const motion = {
  // Durations (ms) - Production presets
  durations: {
    instant: 120, // Reduced motion fallback
    ultraFast: 160, // Micro-interactions
    fast: 200, // Quick feedback
    standard: 260, // Default transitions
    slow: 360, // Deliberate animations
    deliberate: 500, // Long transitions
    // Legacy aliases for backward compatibility
    xs: 90,
    sm: 140,
    md: 220,
    lg: 360,
    xl: 600,
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
    outQuint: Easing.out(Easing.poly(5)),
    outExpo: Easing.out(Easing.exp),
    inOutCubic: Easing.inOut(Easing.cubic),
    // Legacy CSS curves (for web fallback)
    standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    emphasis: 'cubic-bezier(0.3, 0.7, 0, 1)',
  },
} as const
