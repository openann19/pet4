/**
 * Adaptive Animation Configuration
 *
 * Provides adaptive animation configs based on device refresh rate
 * to maintain consistent feel across 60Hz, 120Hz, and 240Hz devices.
 *
 * Location: apps/web/src/effects/core/adaptive-animation-config.ts
 */

import type { DeviceHz } from '../chat/core/telemetry'

/**
 * Base animation configuration (for 60Hz devices)
 */
export interface BaseAnimationConfig {
  duration: number
  stiffness?: number
  damping?: number
  mass?: number
}

/**
 * Adaptive animation configuration
 */
export interface AdaptiveAnimationConfig {
  duration: number
  stiffness: number
  damping: number
  mass: number
  easing?: string
}

/**
 * Device capability detection
 */
export interface DeviceCapability {
  refreshRate: DeviceHz
  isLowEnd: boolean
  isMidRange: boolean
  isHighEnd: boolean
  maxParticles: number
  supportsAdvancedEffects: boolean
}

/**
 * Scale animation duration based on refresh rate
 *
 * Higher refresh rates require shorter durations to maintain the same perceived speed.
 * Formula: scaledDuration = baseDuration * (60 / hz)
 * - 60Hz: base duration (no scaling)
 * - 120Hz: halve duration (2x perceived speed)
 * - 240Hz: quarter duration (4x perceived speed)
 *
 * @param duration - Base duration in milliseconds (for 60Hz)
 * @param refreshHz - Refresh rate in Hz (60, 120, or 240)
 * @returns Scaled duration in milliseconds
 */
export function scaleDuration(duration: number, refreshHz: DeviceHz): number {
  if (refreshHz <= 60) {
    return duration
  }
  // Scale duration proportionally to maintain perceived speed
  // On 120Hz, halve the duration for same perceived speed
  // On 240Hz, quarter the duration for same perceived speed
  return Math.round(duration * (60 / refreshHz))
}

/**
 * Scale spring stiffness based on refresh rate
 *
 * Higher refresh rates can handle higher stiffness values for snappier feel.
 * Formula: scaledStiffness = baseStiffness * (hz / 60)
 * - 60Hz: base stiffness (no scaling)
 * - 120Hz: double stiffness (2x snappier)
 * - 240Hz: quadruple stiffness (4x snappier)
 *
 * @param stiffness - Base stiffness (for 60Hz)
 * @param refreshHz - Refresh rate in Hz (60, 120, or 240)
 * @returns Scaled stiffness
 */
export function scaleSpringStiffness(
  stiffness: number,
  refreshHz: DeviceHz
): number {
  if (refreshHz <= 60) {
    return stiffness
  }
  // Scale stiffness proportionally for snappier feel
  // On 120Hz, double the stiffness for same perceived response
  // On 240Hz, quadruple the stiffness for same perceived response
  return Math.round(stiffness * (refreshHz / 60))
}

/**
 * Detect device capability based on refresh rate and performance
 *
 * @param refreshHz - Device refresh rate in Hz
 * @param frameDropRate - Optional frame drop rate (0-1)
 * @returns Device capability information
 */
export function detectDeviceCapability(
  refreshHz: DeviceHz,
  frameDropRate?: number
): DeviceCapability {
  const isLowEnd = refreshHz === 60 && (frameDropRate ?? 0) > 0.05
  const isMidRange = refreshHz === 120 || (refreshHz === 60 && (frameDropRate ?? 0) <= 0.05)
  const isHighEnd = refreshHz >= 240 || (refreshHz === 120 && (frameDropRate ?? 0) <= 0.02)

  // Particle count limits based on device capability
  let maxParticles = 80
  if (isHighEnd) {
    maxParticles = refreshHz >= 240 ? 200 : 120
  } else if (isMidRange) {
    maxParticles = 100
  }

  return {
    refreshRate: refreshHz,
    isLowEnd,
    isMidRange,
    isHighEnd,
    maxParticles,
    supportsAdvancedEffects: !isLowEnd,
  }
}

/**
 * Create adaptive animation config from base config
 *
 * @param baseConfig - Base animation configuration (for 60Hz)
 * @param refreshHz - Device refresh rate in Hz
 * @returns Adaptive animation configuration
 */
export function createAdaptiveConfig(
  baseConfig: BaseAnimationConfig,
  refreshHz: DeviceHz
): AdaptiveAnimationConfig {
  const duration = scaleDuration(baseConfig.duration, refreshHz)
  const stiffness = baseConfig.stiffness
    ? scaleSpringStiffness(baseConfig.stiffness, refreshHz)
    : 280
  const damping = baseConfig.damping ?? 20
  const mass = baseConfig.mass ?? 1.0

  return {
    duration,
    stiffness,
    damping,
    mass,
  }
}

/**
 * Predefined animation configs with adaptive scaling
 */
export const adaptiveAnimationConfigs = {
  /**
   * Smooth entry animation
   * Base: 300ms, 280 stiffness, 20 damping
   */
  smoothEntry: (refreshHz: DeviceHz = 60): AdaptiveAnimationConfig => {
    return createAdaptiveConfig(
      {
        duration: 300,
        stiffness: 280,
        damping: 20,
        mass: 1.0,
      },
      refreshHz
    )
  },

  /**
   * Bouncy animation
   * Base: 400ms, 500 stiffness, 15 damping
   */
  bouncy: (refreshHz: DeviceHz = 60): AdaptiveAnimationConfig => {
    return createAdaptiveConfig(
      {
        duration: 400,
        stiffness: 500,
        damping: 15,
        mass: 1.0,
      },
      refreshHz
    )
  },

  /**
   * Snappy animation
   * Base: 200ms, 600 stiffness, 20 damping
   */
  snappy: (refreshHz: DeviceHz = 60): AdaptiveAnimationConfig => {
    return createAdaptiveConfig(
      {
        duration: 200,
        stiffness: 600,
        damping: 20,
        mass: 1.0,
      },
      refreshHz
    )
  },

  /**
   * Gentle animation
   * Base: 500ms, 300 stiffness, 30 damping
   */
  gentle: (refreshHz: DeviceHz = 60): AdaptiveAnimationConfig => {
    return createAdaptiveConfig(
      {
        duration: 500,
        stiffness: 300,
        damping: 30,
        mass: 1.0,
      },
      refreshHz
    )
  },
}

/**
 * Get adaptive config for common animation patterns
 *
 * @param pattern - Animation pattern name
 * @param refreshHz - Device refresh rate in Hz
 * @returns Adaptive animation configuration
 */
export function getAdaptiveConfig(
  pattern: keyof typeof adaptiveAnimationConfigs,
  refreshHz: DeviceHz = 60
): AdaptiveAnimationConfig {
  return adaptiveAnimationConfigs[pattern](refreshHz)
}
