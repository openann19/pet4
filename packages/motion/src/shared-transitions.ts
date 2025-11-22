/**
 * Shared Transition Presets and Utilities
 * Platform-agnostic animation configurations and presets
 */

import { Easing, withSpring, withTiming, withDelay } from 'react-native-reanimated'
import type { SpringConfig, TimingConfig, TransitionPreset } from './types'

// ============================================================================
// Spring Configurations
// ============================================================================

export const springConfigs = {
  /**
   * Smooth spring - balanced damping and stiffness
   * Used for: Modal entries, card reveals, general transitions
   */
  smooth: {
    stiffness: 280,
    damping: 20,
    mass: 1,
  } as SpringConfig,

  /**
   * Bouncy spring - lower damping for more bounce
   * Used for: Reactions, celebratory animations, playful interactions
   */
  bouncy: {
    stiffness: 300,
    damping: 18,
    mass: 1,
  } as SpringConfig,

  /**
   * Gentle spring - higher damping for subtle motion
   * Used for: Subtle hover effects, status transitions, micro-interactions
   */
  gentle: {
    stiffness: 250,
    damping: 25,
    mass: 1,
  } as SpringConfig,

  /**
   * Snappy spring - higher stiffness for quick response
   * Used for: Button presses, quick transitions, immediate feedback
   */
  snappy: {
    stiffness: 320,
    damping: 22,
    mass: 1,
  } as SpringConfig,
} as const

// ============================================================================
// Timing Configurations
// ============================================================================

export const timingConfigs = {
  /**
   * Fast timing - quick transitions (120-180ms)
   */
  fast: {
    duration: 150,
    easing: Easing.ease,
  } as TimingConfig,

  /**
   * Smooth timing - balanced transitions (220-280ms)
   */
  smooth: {
    duration: 250,
    easing: Easing.inOut(Easing.ease),
  } as TimingConfig,

  /**
   * Slow timing - deliberate transitions (320-420ms)
   */
  slow: {
    duration: 350,
    easing: Easing.inOut(Easing.ease),
  } as TimingConfig,

  /**
   * Elastic timing - bouncy transitions
   */
  elastic: {
    duration: 400,
    easing: Easing.elastic(1),
  } as TimingConfig,
} as const

// ============================================================================
// Transition Creation Utilities
// ============================================================================

export function createSpringTransition(config: SpringConfig = springConfigs.smooth) {
  return (value: number) => withSpring(value, config)
}

export function createTimingTransition(config: TimingConfig = timingConfigs.smooth) {
  return (value: number) => withTiming(value, config)
}

export function createDelayedTransition(
  delay: number,
  transition: (value: number) => number
) {
  return (value: number) => withDelay(delay, transition(value))
}

// ============================================================================
// Transition Presets
// ============================================================================

export const transitionPresets = {
  /**
   * Fade in transition
   */
  fadeIn: {
    opacity: {
      from: 0,
      to: 1,
      config: timingConfigs.smooth
    }
  } as TransitionPreset,

  /**
   * Fade out transition
   */
  fadeOut: {
    opacity: {
      from: 1,
      to: 0,
      config: timingConfigs.fast
    }
  } as TransitionPreset,

  /**
   * Slide up with fade
   */
  slideUp: {
    translateY: {
      from: 20,
      to: 0,
      config: springConfigs.smooth
    },
    opacity: {
      from: 0,
      to: 1,
      config: timingConfigs.smooth
    }
  } as TransitionPreset,

  /**
   * Slide down with fade
   */
  slideDown: {
    translateY: {
      from: -20,
      to: 0,
      config: springConfigs.smooth
    },
    opacity: {
      from: 0,
      to: 1,
      config: timingConfigs.smooth
    }
  } as TransitionPreset,

  /**
   * Scale in with fade
   */
  scaleIn: {
    scale: {
      from: 0.9,
      to: 1,
      config: springConfigs.bouncy
    },
    opacity: {
      from: 0,
      to: 1,
      config: timingConfigs.smooth
    }
  } as TransitionPreset,

  /**
   * Scale out with fade
   */
  scaleOut: {
    scale: {
      from: 1,
      to: 0.9,
      config: springConfigs.smooth
    },
    opacity: {
      from: 1,
      to: 0,
      config: timingConfigs.fast
    }
  } as TransitionPreset,

  /**
   * Bounce in effect
   */
  bounceIn: {
    scale: {
      from: 0.3,
      to: 1,
      config: springConfigs.bouncy
    },
    opacity: {
      from: 0,
      to: 1,
      config: timingConfigs.elastic
    }
  } as TransitionPreset,

  /**
   * Gentle lift effect
   */
  lift: {
    translateY: {
      from: 0,
      to: -4,
      config: springConfigs.gentle
    },
    scale: {
      from: 1,
      to: 1.02,
      config: springConfigs.gentle
    }
  } as TransitionPreset,
} as const

// ============================================================================
// Validation Utilities
// ============================================================================

export interface SpringConfigRange {
  stiffnessMin: number
  stiffnessMax: number
  dampingMin: number
  dampingMax: number
  mass: number
}

/**
 * Spring configuration ranges per spec
 * Stiffness: 200-400
 * Damping: 12-30 (flexible range for different effects)
 * Mass: 1.0
 */
export const SPRING_RANGES: SpringConfigRange = {
  stiffnessMin: 200,
  stiffnessMax: 400,
  dampingMin: 12,
  dampingMax: 30,
  mass: 1,
}

/**
 * Validate a spring configuration against allowed ranges
 */
export function validateSpringConfig(
  config: SpringConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (config.stiffness !== undefined) {
    if (config.stiffness < SPRING_RANGES.stiffnessMin) {
      errors.push(
        `Stiffness ${String(config.stiffness)} below minimum ${String(SPRING_RANGES.stiffnessMin)}`
      )
    }
    if (config.stiffness > SPRING_RANGES.stiffnessMax) {
      errors.push(
        `Stiffness ${String(config.stiffness)} above maximum ${String(SPRING_RANGES.stiffnessMax)}`
      )
    }
  }

  if (config.damping !== undefined) {
    if (config.damping < SPRING_RANGES.dampingMin) {
      errors.push(
        `Damping ${String(config.damping)} below minimum ${String(SPRING_RANGES.dampingMin)}`
      )
    }
    if (config.damping > SPRING_RANGES.dampingMax) {
      errors.push(
        `Damping ${String(config.damping)} above maximum ${String(SPRING_RANGES.dampingMax)}`
      )
    }
  }

  if (config.mass !== undefined && config.mass !== SPRING_RANGES.mass) {
    errors.push(
      `Mass ${String(config.mass)} must be ${String(SPRING_RANGES.mass)}`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Re-export for backward compatibility
// ============================================================================

export type {
  SpringConfig,
  TimingConfig,
  TransitionPreset,
} from './types'
