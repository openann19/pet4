/**
 * Core Animation Utilities
 * Platform-agnostic animation creation and management
 */

import {
  withSpring,
  withTiming,
  cancelAnimation,
  Easing,
  withSequence,
  withDelay,
  type SharedValue,
} from 'react-native-reanimated'

import { springs, timings, reducedMotion } from './constants'
import type { SpringConfig, TimingConfig, TransitionConfig } from './types'
import { isTruthy, isDefined } from '@/core/guards';

const linearEasing = (value: number): number => Easing.linear(value)
const easeEasing = (value: number): number => Easing.ease(value)
const easeInOutEasing = Easing.inOut(easeEasing)

/**
 * Create a spring animation with proper reduced motion handling
 */
export function createSpringAnimation(
  toValue: number,
  config: Partial<SpringConfig> = {}
): number {
  const isReducedMotion = config.reducedMotion ?? false
  
  if (isTruthy(isReducedMotion)) {
    // Use simplified timing animation for reduced motion
    const baseDuration = config.duration ?? timings.default.duration ?? 300
    const duration = baseDuration * reducedMotion.durationMultiplier
    return withTiming(toValue, {
      duration,
      easing: linearEasing
    })
  }

  // Convert our spring config to Reanimated spring config
  const springConfig = {
    damping: config.damping ?? springs.default.damping,
    stiffness: config.stiffness ?? springs.default.stiffness,
    mass: config.mass ?? springs.default.mass,
    velocity: config.velocity ?? springs.default.velocity,
  }

  return withSpring(toValue, springConfig)
}

/**
 * Create a timing animation with proper reduced motion handling
 */
export function createTimingAnimation(
  toValue: number,
  config: Partial<TimingConfig> = {}
): number {
  const isReducedMotion = config.reducedMotion ?? false
  const duration = config.duration ?? timings.default.duration ?? 300
  
  return withTiming(toValue, {
    duration: isReducedMotion ? duration * reducedMotion.durationMultiplier : duration,
    easing: isReducedMotion ? linearEasing : (config.easing ?? easeInOutEasing)
  })
}

/**
 * Create a sequence of animations
 */
export function createSequenceAnimation(
  keyframes: number[],
  config: Partial<TransitionConfig> = {}
): number {
  const isReducedMotion = config.reducedMotion ?? false
  const finalValue = keyframes[keyframes.length - 1] ?? 0
  
  if (isTruthy(isReducedMotion)) {
    // For reduced motion, just animate to final value
    return createTimingAnimation(finalValue, {
      ...config,
      reducedMotion: true
    })
  }

  const animations = keyframes.map((toValue) => {
    return config.type === 'spring'
      ? createSpringAnimation(toValue, config.springConfig)
      : createTimingAnimation(toValue, config.timingConfig)
  })

  return withSequence(...animations)
}

/**
 * Create a delayed animation
 */
export function createDelayedAnimation(
  toValue: number,
  delay: number,
  config: Partial<TransitionConfig> = {}
): number {
  const isReducedMotion = config.reducedMotion ?? false
  const actualDelay = isReducedMotion ? 0 : delay

  const animation = config.type === 'spring'
    ? createSpringAnimation(toValue, config.springConfig)
    : createTimingAnimation(toValue, config.timingConfig)

  return withDelay(actualDelay, animation)
}

/**
 * Stop all animations on a shared value
 */
export function stopAnimation(value: SharedValue<number>): void {
  cancelAnimation(value)
}

/**
 * Get animation duration based on reduced motion preference
 */
export function getAnimationDuration(baseDuration: number, isReducedMotion: boolean): number {
  return isReducedMotion ? baseDuration * reducedMotion.durationMultiplier : baseDuration
}

/**
 * Create staggered animations for multiple values
 */
export function createStaggerAnimation(
  values: SharedValue<number>[],
  toValue: number,
  staggerDelay: number,
  config: Partial<TransitionConfig> = {}
): number[] {
  return values.map((_, index) => {
    return createDelayedAnimation(toValue, index * staggerDelay, config)
  })
}

/**
 * Create looping animation
 */
export function createLoopingAnimation(
  keyframes: number[],
  config: Partial<TransitionConfig> & { iterations?: number } = {}
): number {
  const isReducedMotion = config.reducedMotion ?? false
  const firstValue = keyframes[0] ?? 0
  
  if (isTruthy(isReducedMotion)) {
    // Don't loop in reduced motion mode
    return createTimingAnimation(firstValue, {
      ...config,
      reducedMotion: true
    })
  }

  const sequence = createSequenceAnimation(keyframes, config)
  if (config.iterations !== undefined && config.iterations > 0) {
    const iterations = Array.from({ length: config.iterations }, () => sequence)
    return withSequence(...iterations)
  }

  const defaultIterations = Array.from({ length: 2 }, () => sequence)
  return withSequence(...defaultIterations)
}