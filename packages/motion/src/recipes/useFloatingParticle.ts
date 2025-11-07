/**
 * useFloatingParticle
 * Shared animation hook for creating floating particle effects
 * 
 * @packageDocumentation
 * @category Animation Hooks
 * @subcategory Particles
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useSharedValue, useAnimatedStyle, type SharedValue } from 'react-native-reanimated'
import type { ParticleBaseConfig } from '../core/types'
import { createSpringAnimation, createTimingAnimation, stopAnimation } from '../core/animations'
import { useReducedMotion } from '../core/hooks'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseFloatingParticleOptions extends ParticleBaseConfig {
  /**
   * Initial position offset (0-1 range)
   * @default { x: 0.5, y: 0.5 }
   */
  initialOffset?: { x: number; y: number }

  /**
   * Amplitude of floating motion (pixels)
   * @default { x: 30, y: 30 }
   */
  amplitude?: { x: number; y: number }

  /**
   * Duration of one float cycle (ms)
   * @default 2000
   */
  floatDuration?: number

  /**
   * Whether particle should fade out at end of cycle
   * @default true
   */
  fadeOut?: boolean

  /**
   * Whether particle should scale while floating
   * @default true
   */
  enableScale?: boolean

  /**
   * Spring configuration for initial appearance
   */
  appearSpringConfig?: {
    damping?: number
    stiffness?: number
    mass?: number
  }
}

export interface UseFloatingParticleReturn {
  /**
   * Animated style object for particle
   */
  style: ReturnType<typeof useAnimatedStyle>

  /**
   * Start the floating animation
   */
  start: () => void

  /**
   * Stop the floating animation
   */
  stop: () => void

  /**
   * Reset to initial state
   */
  reset: () => void

  /**
   * Whether particle is currently animating
   */
  isAnimating: boolean
}

interface ResolvedFloatingParticleConfig {
  readonly count: number
  readonly lifetime: number
  readonly velocity: number
  readonly spread: number
  readonly size: number
  readonly color: string
  readonly opacity: number
  readonly initialOffset: { readonly x: number; readonly y: number }
  readonly amplitude: { readonly x: number; readonly y: number }
  readonly floatDuration: number
  readonly fadeOut: boolean
  readonly enableScale: boolean
  readonly appearSpringConfig: {
    readonly damping: number
    readonly stiffness: number
    readonly mass: number
  }
}

const defaultConfig = {
  count: 1,
  lifetime: 2000,
  velocity: 100,
  spread: 0.5,
  size: 8,
  color: '#ffffff',
  opacity: 1,
  initialOffset: { x: 0.5, y: 0.5 },
  amplitude: { x: 30, y: 30 },
  floatDuration: 2000,
  fadeOut: true,
  enableScale: true,
  appearSpringConfig: {
    damping: 10,
    stiffness: 100,
    mass: 1
  }
} as const

export function useFloatingParticle(
  options: Partial<UseFloatingParticleOptions> = {}
): UseFloatingParticleReturn {
  const config = useMemo<ResolvedFloatingParticleConfig>(() => {
    const springOverrides = options.appearSpringConfig ?? {}

    return {
      count: options.count ?? defaultConfig.count,
      lifetime: options.lifetime ?? defaultConfig.lifetime,
      velocity: options.velocity ?? defaultConfig.velocity,
      spread: options.spread ?? defaultConfig.spread,
      size: options.size ?? defaultConfig.size,
      color: options.color ?? defaultConfig.color,
      opacity: options.opacity ?? defaultConfig.opacity,
      initialOffset: {
        x: options.initialOffset?.x ?? defaultConfig.initialOffset.x,
        y: options.initialOffset?.y ?? defaultConfig.initialOffset.y,
      },
      amplitude: {
        x: options.amplitude?.x ?? defaultConfig.amplitude.x,
        y: options.amplitude?.y ?? defaultConfig.amplitude.y,
      },
      floatDuration: options.floatDuration ?? defaultConfig.floatDuration,
      fadeOut: options.fadeOut ?? defaultConfig.fadeOut,
      enableScale: options.enableScale ?? defaultConfig.enableScale,
      appearSpringConfig: {
        damping: springOverrides.damping ?? defaultConfig.appearSpringConfig.damping,
        stiffness: springOverrides.stiffness ?? defaultConfig.appearSpringConfig.stiffness,
        mass: springOverrides.mass ?? defaultConfig.appearSpringConfig.mass,
      }
    }
  }, [
    options.amplitude?.x,
    options.amplitude?.y,
  options.appearSpringConfig,
    options.color,
    options.count,
    options.enableScale,
    options.fadeOut,
    options.floatDuration,
    options.initialOffset?.x,
    options.initialOffset?.y,
    options.lifetime,
    options.opacity,
    options.size,
    options.spread,
    options.velocity,
  ])
  const isReducedMotion = useReducedMotion()

  // Position values
  const x: SharedValue<number> = useSharedValue<number>(0)
  const y: SharedValue<number> = useSharedValue<number>(0)
  const scale: SharedValue<number> = useSharedValue<number>(0)
  const opacityValue: SharedValue<number> = useSharedValue<number>(0)

  // Animation state
  const isActive: SharedValue<boolean> = useSharedValue<boolean>(false)

  const reset = useCallback(() => {
    x.value = config.initialOffset.x * config.spread
    y.value = config.initialOffset.y * config.spread
    scale.value = 0
    opacityValue.value = 0
    isActive.value = false
  }, [config, isActive, opacityValue, scale, x, y])

  const start = useCallback(() => {
    if (isTruthy(isActive.value)) {
      return
    }

    isActive.value = true

    // Initial appear animation
    if (isTruthy(isReducedMotion.value)) {
      // Simplified appear for reduced motion
      opacityValue.value = config.opacity
      scale.value = 1
    } else {
      opacityValue.value = createSpringAnimation(config.opacity, {
        ...config.appearSpringConfig,
        reducedMotion: isReducedMotion.value
      })
      scale.value = createSpringAnimation(1, {
        ...config.appearSpringConfig,
        reducedMotion: isReducedMotion.value
      })
    }

    // Start floating motion
    const animate = () => {
      if (!isActive.value) {
        return
      }

      const xTarget = x.value + (Math.random() - 0.5) * config.amplitude.x
      const yTarget = y.value + (Math.random() - 0.5) * config.amplitude.y

      x.value = createTimingAnimation(xTarget, {
        duration: config.floatDuration,
        reducedMotion: isReducedMotion.value
      })

      y.value = createTimingAnimation(yTarget, {
        duration: config.floatDuration,
        reducedMotion: isReducedMotion.value
      })

      if (config.enableScale && !isReducedMotion.value) {
        scale.value = createTimingAnimation(0.8 + Math.random() * 0.4, {
          duration: config.floatDuration,
          reducedMotion: isReducedMotion.value
        })
      }

      // Schedule next animation
      setTimeout(animate, config.floatDuration)
    }

    animate()
  }, [config, isActive, isReducedMotion, scale, x, y, opacityValue])

  const stop = useCallback(() => {
    if (!isActive.value) {
      return
    }
    isActive.value = false

    if (isTruthy(config.fadeOut)) {
      opacityValue.value = createTimingAnimation(0, {
        duration: 300,
        reducedMotion: isReducedMotion.value
      })
    }

    stopAnimation(x)
    stopAnimation(y)
    stopAnimation(scale)
  }, [config.fadeOut, isActive, isReducedMotion, scale, x, y, opacityValue])

  // Create animated style
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value }
    ],
    opacity: opacityValue.value,
  }))

  // Reset on mount
  useEffect(() => {
    reset()
  }, [reset])

  return {
    style,
    start,
    stop,
    reset,
    isAnimating: isActive.value
  }
}