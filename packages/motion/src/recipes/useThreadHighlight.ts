/**
 * useThreadHighlight
 * Shared animation hook for highlighting threads/messages with glow effects
 * 
 * @packageDocumentation
 * @category Animation Hooks
 * @subcategory Chat Effects
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useSharedValue, useAnimatedStyle, interpolateColor, type SharedValue } from 'react-native-reanimated'
import { createSpringAnimation, createTimingAnimation } from '../core/animations'
import { useReducedMotion } from '../core/hooks'
import type { BaseAnimationConfig } from '../core/types'
import { isTruthy, isDefined } from '@/core/guards';

export interface UseThreadHighlightOptions extends BaseAnimationConfig {
  /**
   * Base color for the highlight effect
   * @default '#4F46E5'
   */
  highlightColor?: string

  /**
   * Background color when not highlighted
   * @default 'transparent'
   */
  baseColor?: string

  /**
   * Intensity of the glow effect (0-1)
   * @default 0.8
   */
  glowIntensity?: number

  /**
   * Blur radius for the glow effect (pixels)
   * @default 8
   */
  glowRadius?: number

  /**
   * Duration for highlight fade in/out (ms)
   * @default 300
   */
  highlightDuration?: number

  /**
   * Whether to pulse the highlight effect
   * @default false
   */
  enablePulse?: boolean

  /**
   * Pulse duration if enabled (ms)
   * @default 1200
   */
  pulseDuration?: number

  /**
   * Auto-dismiss highlight after duration (ms, 0 = manual)
   * @default 0
   */
  autoDismissAfter?: number

  /**
   * Spring configuration for highlight animations
   */
  springConfig?: {
    damping?: number
    stiffness?: number
    mass?: number
  }
}

export interface UseThreadHighlightReturn {
  /**
   * Animated style object for the highlight effect
   */
  style: ReturnType<typeof useAnimatedStyle>

  /**
   * Start the highlight effect
   */
  highlight: () => void

  /**
   * Stop the highlight effect
   */
  unhighlight: () => void

  /**
   * Toggle highlight state
   */
  toggle: () => void

  /**
   * Current highlight state
   */
  isHighlighted: boolean

  /**
   * Reset to base state
   */
  reset: () => void
}

type TimeoutHandle = ReturnType<typeof setTimeout>

interface ResolvedThreadHighlightConfig {
  readonly highlightColor: string
  readonly baseColor: string
  readonly glowIntensity: number
  readonly glowRadius: number
  readonly highlightDuration: number
  readonly enablePulse: boolean
  readonly pulseDuration: number
  readonly autoDismissAfter: number
  readonly springConfig: {
    readonly damping: number
    readonly stiffness: number
    readonly mass: number
  }
}

const defaultConfig = {
  highlightColor: '#4F46E5',
  baseColor: 'transparent',
  glowIntensity: 0.8,
  glowRadius: 8,
  highlightDuration: 300,
  enablePulse: false,
  pulseDuration: 1200,
  autoDismissAfter: 0,
  springConfig: {
    damping: 15,
    stiffness: 150,
    mass: 1
  }
} as const

export function useThreadHighlight(
  options: UseThreadHighlightOptions = {}
): UseThreadHighlightReturn {
  const highlightColor = options.highlightColor ?? defaultConfig.highlightColor
  const baseColor = options.baseColor ?? defaultConfig.baseColor
  const glowIntensity = options.glowIntensity ?? defaultConfig.glowIntensity
  const glowRadius = options.glowRadius ?? defaultConfig.glowRadius
  const highlightDuration = options.highlightDuration ?? defaultConfig.highlightDuration
  const enablePulse = options.enablePulse ?? defaultConfig.enablePulse
  const pulseDuration = options.pulseDuration ?? defaultConfig.pulseDuration
  const autoDismissAfter = options.autoDismissAfter ?? defaultConfig.autoDismissAfter

  const springConfig = useMemo(
    () => ({
      damping: options.springConfig?.damping ?? defaultConfig.springConfig.damping,
      stiffness: options.springConfig?.stiffness ?? defaultConfig.springConfig.stiffness,
      mass: options.springConfig?.mass ?? defaultConfig.springConfig.mass,
    }),
    [
      options.springConfig?.damping,
      options.springConfig?.mass,
      options.springConfig?.stiffness,
    ]
  )

  const config = useMemo<ResolvedThreadHighlightConfig>(
    () => ({
      highlightColor,
      baseColor,
      glowIntensity,
      glowRadius,
      highlightDuration,
      enablePulse,
      pulseDuration,
      autoDismissAfter,
      springConfig,
    }),
    [
      autoDismissAfter,
      baseColor,
      enablePulse,
      glowIntensity,
      glowRadius,
      highlightColor,
      highlightDuration,
      pulseDuration,
      springConfig,
    ]
  )
  const isReducedMotion = useReducedMotion()

  // Animation values
  const highlightProgress: SharedValue<number> = useSharedValue<number>(0)
  const pulseProgress: SharedValue<number> = useSharedValue<number>(0)
  const glowProgress: SharedValue<number> = useSharedValue<number>(0)

  // State tracking
  const isActive: SharedValue<boolean> = useSharedValue<boolean>(false)
  const pulseAnimationId: SharedValue<TimeoutHandle | null> = useSharedValue<TimeoutHandle | null>(null)
  const autoDismissId: SharedValue<TimeoutHandle | null> = useSharedValue<TimeoutHandle | null>(null)

  const reset = useCallback(() => {
    highlightProgress.value = 0
    pulseProgress.value = 0
    glowProgress.value = 0
    isActive.value = false

    // Clear any running timers
    if (pulseAnimationId.value !== null) {
      clearTimeout(pulseAnimationId.value)
      pulseAnimationId.value = null
    }
    if (autoDismissId.value !== null) {
      clearTimeout(autoDismissId.value)
      autoDismissId.value = null
    }
  }, [highlightProgress, pulseProgress, glowProgress, isActive, pulseAnimationId, autoDismissId])

  const unhighlight = useCallback(() => {
    if (!isActive.value) {
      return
    }

    isActive.value = false

    // Clear pulse animation
    if (pulseAnimationId.value !== null) {
      clearTimeout(pulseAnimationId.value)
      pulseAnimationId.value = null
    }

    // Clear auto-dismiss
    if (autoDismissId.value !== null) {
      clearTimeout(autoDismissId.value)
      autoDismissId.value = null
    }

    // Animate highlight disappearance
    if (isTruthy(isReducedMotion.value)) {
      highlightProgress.value = 0
      glowProgress.value = 0
      pulseProgress.value = 0
    } else {
      highlightProgress.value = createSpringAnimation(0, {
        ...config.springConfig,
        reducedMotion: isReducedMotion.value
      })

      glowProgress.value = createTimingAnimation(0, {
        duration: config.highlightDuration,
        reducedMotion: isReducedMotion.value
      })

      pulseProgress.value = createTimingAnimation(0, {
        duration: config.highlightDuration / 2,
        reducedMotion: isReducedMotion.value
      })
    }
  }, [config, isActive, highlightProgress, glowProgress, pulseProgress, pulseAnimationId, autoDismissId, isReducedMotion])

  const highlight = useCallback(() => {
    if (isTruthy(isActive.value)) {
      return
    }

    isActive.value = true

    // Animate highlight appearance
    if (isTruthy(isReducedMotion.value)) {
      highlightProgress.value = 1
      glowProgress.value = config.glowIntensity
    } else {
      highlightProgress.value = createSpringAnimation(1, {
        ...config.springConfig,
        reducedMotion: isReducedMotion.value
      })

      glowProgress.value = createTimingAnimation(config.glowIntensity, {
        duration: config.highlightDuration,
        reducedMotion: isReducedMotion.value
      })
    }

    // Start pulse animation if enabled
    if (config.enablePulse && !isReducedMotion.value) {
      const startPulse = () => {
        if (!isActive.value) {
          return
        }

        pulseProgress.value = createTimingAnimation(1, {
          duration: config.pulseDuration / 2
        })

        setTimeout(() => {
          if (!isActive.value) {
            return
          }
          pulseProgress.value = createTimingAnimation(0, {
            duration: config.pulseDuration / 2
          })
        }, config.pulseDuration / 2)

        pulseAnimationId.value = setTimeout(startPulse, config.pulseDuration)
      }
      startPulse()
    }

    // Auto-dismiss if configured
    if (config.autoDismissAfter > 0) {
      autoDismissId.value = setTimeout(() => {
        unhighlight()
      }, config.autoDismissAfter)
    }
  }, [
    autoDismissId,
    config,
    glowProgress,
    highlightProgress,
    isActive,
    isReducedMotion,
    pulseAnimationId,
    pulseProgress,
    unhighlight,
  ])

  const toggle = useCallback(() => {
    if (isTruthy(isActive.value)) {
      unhighlight()
      return
    }

    highlight()
  }, [isActive, highlight, unhighlight])

  // Create animated style
  const style = useAnimatedStyle(() => {
    const backgroundOpacity = highlightProgress.value * 0.1
    const backgroundColor = interpolateColor(
      backgroundOpacity,
      [0, 0.1],
      [config.baseColor, config.highlightColor]
    )

    const glowOpacity = glowProgress.value + (pulseProgress.value * 0.3)
    const shadowOpacity = Math.min(glowOpacity, 1)

    return {
      backgroundColor,
      shadowColor: config.highlightColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius: config.glowRadius * glowOpacity,
      elevation: shadowOpacity * 4, // Android shadow
    }
  })

  // Reset on unmount
  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  return {
    style,
    highlight,
    unhighlight,
    toggle,
    isHighlighted: isActive.value,
    reset,
  }
}