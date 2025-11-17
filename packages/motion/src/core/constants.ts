/**
 * Shared Animation Constants and Configurations
 */

import { Easing } from 'react-native-reanimated'
import type { SpringConfig, TimingConfig } from './types'

// Default spring configurations
export const springs = {
  // Gentle spring for subtle interactions
  gentle: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  } as SpringConfig,

  // Default spring for most animations
  default: {
    damping: 18,
    stiffness: 180,
    mass: 1,
  } as SpringConfig,

  // Bouncy spring for playful animations
  bouncy: {
    damping: 12,
    stiffness: 200,
    mass: 1,
    velocity: 2,
  } as SpringConfig,

  // Stiff spring for quick snappy animations
  stiff: {
    damping: 25,
    stiffness: 300,
    mass: 1,
  } as SpringConfig,
}

// Default timing configurations
export const timings = {
  // Quick micro-interactions
  quick: {
    duration: 150,
    easing: Easing.out(Easing.quad),
  } as TimingConfig,

  // Default duration for most animations
  default: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  } as TimingConfig,

  // Slower duration for emphasis
  emphasis: {
    duration: 450,
    easing: Easing.inOut(Easing.cubic),
  } as TimingConfig,

  // Long duration for complex animations
  complex: {
    duration: 600,
    // Note: Easing.bezier returns a factory object in Reanimated 3.10.1
    // Helper to safely extract the easing function
    easing: (() => {
      const bezierFactory = Easing.bezier(0.16, 1, 0.3, 1)
      // Cast to the expected function type for compatibility
      return bezierFactory as unknown as (t: number) => number
    })(),
  } as TimingConfig,
}

// Reduced motion configurations
export const reducedMotion = {
  // Duration multiplier when reduced motion is enabled
  durationMultiplier: 0.5,

  // Simplified spring config for reduced motion
  spring: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  } as SpringConfig,

  // Simplified timing config for reduced motion
  timing: {
    duration: 150,
    easing: Easing.linear,
  } as TimingConfig,
}

// Performance budget thresholds
export const performanceBudgets = {
  targetFPS: 60,
  dropThreshold: 0.1, // 10% dropped frames threshold
  complexityBudget: 4, // max number of simultaneous complex animations
  particleBudget: 50, // max number of particles
}

// Gesture configurations
export const gestureConfigs = {
  // Magnetic effect
  magnetic: {
    elasticDamping: 0.7,
    resistanceFactor: 0.5,
    velocityFactor: 0.8,
  },

  // Swipe gestures
  swipe: {
    threshold: 20,
    velocityThreshold: 500,
    elasticDamping: 0.8,
  },

  // Pull to refresh
  pull: {
    threshold: 80,
    resistanceFactor: 0.6,
    dampingFactor: 0.7,
  },
}

// Chat effect configurations
export const chatEffects = {
  bubble: {
    entry: {
      duration: 400,
      stagger: 50,
      springConfig: springs.default,
    },
    exit: {
      duration: 300,
      stagger: 30,
      springConfig: springs.gentle,
    },
  },
  typing: {
    shimmer: {
      duration: 1200,
      delay: 300,
    },
    dots: {
      springConfig: springs.bouncy,
      stagger: 120,
    },
  },
  reaction: {
    burst: {
      particleCount: 12,
      spread: 0.8,
      velocity: 200,
    },
    scale: {
      springConfig: springs.bouncy,
    },
  },
}