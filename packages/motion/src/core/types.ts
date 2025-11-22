/**
 * Core Animation Types
 * Shared between web and mobile platforms
 */

import type { SharedValue } from 'react-native-reanimated'

// Base animation configuration
export interface BaseAnimationConfig {
  duration?: number
  delay?: number
  reducedMotion?: boolean
  type?: 'spring' | 'timing'
}

// Spring animation configuration
export interface SpringConfig extends BaseAnimationConfig {
  damping?: number
  stiffness?: number
  mass?: number
  velocity?: number
}

// Timing animation configuration
export interface TimingConfig extends BaseAnimationConfig {
  // Easing function mapping t in [0,1] -> [0,1]
  easing?: (t: number) => number
}

// Platform-agnostic animation style type
export type AnimatedStyle = {
  [key: string]: number | string | SharedValue<number | string>
}

// Animation hook return type
export interface AnimationHookReturn {
  animatedStyle: AnimatedStyle
  isAnimating: boolean
  start: () => void
  stop: () => void
  reset: () => void
}

// Gesture animation options
export interface GestureAnimationOptions {
  enabled?: boolean
  hapticFeedback?: boolean
  elasticDamping?: number
  resistanceFactor?: number
}

// Base particle configuration with optional fields
export interface ParticleBaseConfig {
  /**
   * Number of particles to create
   * @default 1
   */
  count?: number
  
  /**
   * Lifetime of each particle in milliseconds
   * @default 2000
   */
  lifetime?: number
  
  /**
   * Velocity of particle motion in pixels/second
   * @default 100
   */
  velocity?: number
  
  /**
   * Spread factor for randomization (0-1 range)
   * @default 0.5
   */
  spread?: number
  
  /**
   * Size of particles in pixels
   * @default 8
   */
  size?: number
  
  /**
   * Color of particles (any valid CSS color)
   * @default '#ffffff'
   */
  color?: string
  
  /**
   * Base opacity of particles (0-1 range)
   * @default 1
   */
  opacity?: number
}

// Full particle configuration with all fields required
export interface ParticleSystemConfig extends Required<ParticleBaseConfig> {}

// Shared transition configuration
export interface TransitionConfig extends BaseAnimationConfig {
  springConfig?: Omit<SpringConfig, keyof BaseAnimationConfig>
  timingConfig?: Omit<TimingConfig, keyof BaseAnimationConfig>
  initialValues?: Record<string, number>
  finalValues?: Record<string, number>
}

// Reduced motion configuration
export interface ReducedMotionConfig {
  enabled: boolean
  durationMultiplier: number
  disableSpringPhysics: boolean
  simplifyEffects: boolean
}

// Animation telemetry data
export interface AnimationTelemetry {
  name: string
  duration: number
  targetFPS: number
  actualFPS: number
  dropped: number
  timestamp: number
  deviceInfo: {
    platform: string
    version: string
    model?: string
  }
}