/**
 * Button State Animation Hook (Web)
 *
 * Provides premium button state animations with:
 * - Hover: scale, glow, color shift
 * - Active: press down effect
 * - Disabled: fade, desaturate
 * - Loading: spinner, pulse
 * - Success/Error states with haptics
 * - Reduced motion support
 *
 * Location: apps/web/src/hooks/micro-interactions/use-button-state.ts
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  type SharedValue,
} from '@petspark/motion'
import { createLogger } from '@/lib/logger'
import { triggerHaptic } from '@/effects/chat/core/haptic-manager'
import { useReducedMotionSV } from '@/effects/chat/core/reduced-motion'
import { useUIConfig } from '@/hooks/use-ui-config'

const logger = createLogger('button-state')

/**
 * Button state type
 */
export type ButtonState = 'idle' | 'hover' | 'active' | 'disabled' | 'loading' | 'success' | 'error'

/**
 * Button variant type
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

/**
 * Button state options
 */
export interface UseButtonStateOptions {
  readonly enabled?: boolean
  readonly variant?: ButtonVariant
  readonly disabled?: boolean
  readonly loading?: boolean
  readonly initialState?: ButtonState
  readonly enableHaptics?: boolean
  readonly enableSound?: boolean
  readonly onStateChange?: (state: ButtonState) => void
}

/**
 * Button state return type
 */
export interface UseButtonStateReturn {
  readonly state: ButtonState
  readonly scale: SharedValue<number>
  readonly opacity: SharedValue<number>
  readonly glowIntensity: SharedValue<number>
  readonly colorShift: SharedValue<number>
  readonly spinnerRotation: SharedValue<number>
  readonly animatedStyle: ReturnType<typeof useAnimatedStyle>
  readonly handlers: {
    readonly onMouseEnter: () => void
    readonly onMouseLeave: () => void
    readonly onMouseDown: () => void
    readonly onMouseUp: () => void
    readonly onClick: () => void
    readonly onFocus: () => void
    readonly onBlur: () => void
  }
  readonly setState: (state: ButtonState) => void
  readonly setSuccess: () => void
  readonly setError: () => void
}

const DEFAULT_ENABLED = true
const HOVER_SCALE = 1.02
const ACTIVE_SCALE = 0.97
const DISABLED_OPACITY = 0.5
const GLOW_INTENSITY = 0.3
const SUCCESS_DURATION = 2000 // ms
const ERROR_DURATION = 2000 // ms

export function useButtonState(
  options: UseButtonStateOptions = {}
): UseButtonStateReturn {
  const {
    enabled = DEFAULT_ENABLED,
    variant = 'primary',
    disabled = false,
    loading = false,
    initialState = 'idle',
    enableHaptics = true,
    _enableSound = false,
    onStateChange,
  } = options

  const { feedback, animation } = useUIConfig()
  const reducedMotion = useReducedMotionSV()

  // Animation values
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const glowIntensity = useSharedValue(0)
  const colorShift = useSharedValue(0)
  const spinnerRotation = useSharedValue(0)

  // State
  const [state, setState] = useState<ButtonState>(initialState)

  // Update state based on props
  useEffect(() => {
    if (disabled) {
      setState('disabled')
    } else if (loading) {
      setState('loading')
    } else if (state === 'disabled' || state === 'loading') {
      setState('idle')
    }
  }, [disabled, loading, state])

  // Apply state animations
  useEffect(() => {
    const isReducedMotion = reducedMotion.value

    switch (state) {
      case 'idle':
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 200,
        })
        opacity.value = withTiming(1, { duration: 200 })
        glowIntensity.value = withTiming(0, { duration: 200 })
        colorShift.value = withTiming(0, { duration: 200 })
        spinnerRotation.value = 0
        break

      case 'hover':
        if (!isReducedMotion) {
          scale.value = withSpring(HOVER_SCALE, {
            damping: 12,
            stiffness: 300,
          })
          glowIntensity.value = withTiming(GLOW_INTENSITY, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          })
        }
        break

      case 'active':
        if (!isReducedMotion) {
          scale.value = withSpring(ACTIVE_SCALE, {
            damping: 20,
            stiffness: 400,
          })
        }
        glowIntensity.value = withTiming(GLOW_INTENSITY * 0.5, {
          duration: 100,
        })
        break

      case 'disabled':
        opacity.value = withTiming(DISABLED_OPACITY, {
          duration: 200,
          easing: Easing.out(Easing.ease),
        })
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 200,
        })
        glowIntensity.value = withTiming(0, { duration: 200 })
        colorShift.value = withTiming(-0.2, { duration: 200 }) // Desaturate
        break

      case 'loading':
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 200,
        })
        opacity.value = withTiming(0.8, { duration: 200 })

        // Continuous spinner rotation
        if (!isReducedMotion) {
          spinnerRotation.value = withRepeat(
            withTiming(360, {
              duration: 1000,
              easing: Easing.linear,
            }),
            -1, // Infinite
            false
          )
        }
        break

      case 'success':
        if (!isReducedMotion) {
          scale.value = withSpring(1.05, {
            damping: 10,
            stiffness: 300,
          })
        }
        colorShift.value = withTiming(0.2, {
          duration: 200,
          easing: Easing.out(Easing.ease),
        }) // Green tint
        glowIntensity.value = withTiming(GLOW_INTENSITY * 1.5, {
          duration: 200,
        })

        // Haptic feedback
        if (enableHaptics && feedback.haptics) {
          triggerHaptic('success')
        }

        // Auto-reset after duration
        setTimeout(() => {
          if (state === 'success') {
            setState('idle')
          }
        }, SUCCESS_DURATION)
        break

      case 'error':
        if (!isReducedMotion) {
          // Shake animation
          scale.value = withSpring(1, {
            damping: 8,
            stiffness: 400,
          })
        }
        colorShift.value = withTiming(-0.3, {
          duration: 200,
          easing: Easing.out(Easing.ease),
        }) // Red tint
        glowIntensity.value = withTiming(GLOW_INTENSITY * 1.5, {
          duration: 200,
        })

        // Haptic feedback
        if (enableHaptics && feedback.haptics) {
          triggerHaptic('error')
        }

        // Auto-reset after duration
        setTimeout(() => {
          if (state === 'error') {
            setState('idle')
          }
        }, ERROR_DURATION)
        break
    }

    // Notify state change
    onStateChange?.(state)

    logger.debug('Button state changed', { state, variant })
  }, [
    state,
    variant,
    scale,
    opacity,
    glowIntensity,
    colorShift,
    spinnerRotation,
    reducedMotion,
    animation,
    feedback.haptics,
    enableHaptics,
    onStateChange,
  ])

  // Handlers
  const onMouseEnter = useCallback(() => {
    if (!enabled || disabled || loading) {
      return
    }
    setState('hover')
  }, [enabled, disabled, loading])

  const onMouseLeave = useCallback(() => {
    if (!enabled || disabled || loading) {
      return
    }
    setState('idle')
  }, [enabled, disabled, loading])

  const onMouseDown = useCallback(() => {
    if (!enabled || disabled || loading) {
      return
    }
    setState('active')

    if (enableHaptics && feedback.haptics) {
      triggerHaptic('light')
    }
  }, [enabled, disabled, loading, enableHaptics, feedback.haptics])

  const onMouseUp = useCallback(() => {
    if (!enabled || disabled || loading) {
      return
    }
    setState('hover')
  }, [enabled, disabled, loading])

  const onClick = useCallback(() => {
    if (!enabled || disabled || loading) {
      return
    }

    if (enableHaptics && feedback.haptics) {
      triggerHaptic('selection')
    }

    logger.debug('Button clicked', { variant })
  }, [enabled, disabled, loading, enableHaptics, feedback.haptics, variant])

  const onFocus = useCallback(() => {
    if (!enabled || disabled || loading) {
      return
    }
    // Keyboard focus should show hover state
    setState('hover')
  }, [enabled, disabled, loading])

  const onBlur = useCallback(() => {
    if (!enabled || disabled || loading) {
      return
    }
    setState('idle')
  }, [enabled, disabled, loading])

  const setSuccess = useCallback(() => {
    if (!enabled) {
      return
    }
    setState('success')
  }, [enabled])

  const setError = useCallback(() => {
    if (!enabled) {
      return
    }
    setState('error')
  }, [enabled])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }
  })

  return {
    state,
    scale,
    opacity,
    glowIntensity,
    colorShift,
    spinnerRotation,
    animatedStyle,
    handlers: {
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onClick,
      onFocus,
      onBlur,
    },
    setState,
    setSuccess,
    setError,
  }
}
