/**
 * Form Input Animation Hook (Web)
 *
 * Provides premium form input animations with:
 * - Focus: border glow, label float
 * - Validation states: success, error, warning
 * - Error shake animation
 * - Character count with color progression
 * - Haptic feedback on validation
 * - Reduced motion support
 *
 * Location: apps/web/src/hooks/micro-interactions/use-input-state.ts
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  type SharedValue,
} from 'react-native-reanimated'
import { createLogger } from '@/lib/logger'
import { triggerHaptic } from '@/effects/chat/core/haptic-manager'
import { useReducedMotionSV } from '@/effects/chat/core/reduced-motion'
import { useUIConfig } from '@/hooks/use-ui-config'

const logger = createLogger('input-state')

/**
 * Input validation state
 */
export type InputValidationState = 'idle' | 'focus' | 'success' | 'error' | 'warning'

/**
 * Input state options
 */
export interface UseInputStateOptions {
  readonly enabled?: boolean
  readonly value?: string
  readonly maxLength?: number
  readonly validationState?: InputValidationState
  readonly errorMessage?: string
  readonly enableHaptics?: boolean
  readonly onValidationChange?: (state: InputValidationState) => void
}

/**
 * Input state return type
 */
export interface UseInputStateReturn {
  readonly state: InputValidationState
  readonly isFocused: boolean
  readonly borderGlow: SharedValue<number>
  readonly labelOffset: SharedValue<number>
  readonly shakeOffset: SharedValue<number>
  readonly borderColor: SharedValue<string>
  readonly characterProgress: SharedValue<number>
  readonly animatedInputStyle: ReturnType<typeof useAnimatedStyle>
  readonly animatedLabelStyle: ReturnType<typeof useAnimatedStyle>
  readonly handlers: {
    readonly onFocus: () => void
    readonly onBlur: () => void
    readonly onChange: (value: string) => void
  }
  readonly setValidationState: (state: InputValidationState) => void
}

const DEFAULT_ENABLED = true
const LABEL_OFFSET_FOCUSED = -24 // px
const LABEL_OFFSET_IDLE = 0 // px
const BORDER_GLOW_FOCUS = 1
const SHAKE_DISTANCE = 8 // px

const BORDER_COLORS = {
  idle: '#D1D5DB',
  focus: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
} as const

export function useInputState(
  options: UseInputStateOptions = {}
): UseInputStateReturn {
  const {
    enabled = DEFAULT_ENABLED,
    value = '',
    maxLength,
    validationState: externalValidationState,
    errorMessage,
    enableHaptics = true,
    onValidationChange,
  } = options

  const { feedback } = useUIConfig()
  const reducedMotion = useReducedMotionSV()

  // Animation values
  const borderGlow = useSharedValue(0)
  const labelOffset = useSharedValue(value ? LABEL_OFFSET_FOCUSED : LABEL_OFFSET_IDLE)
  const shakeOffset = useSharedValue(0)
  const borderColor = useSharedValue<string>(BORDER_COLORS.idle)
  const characterProgress = useSharedValue(0)

  // State
  const [state, setState] = useState<InputValidationState>(externalValidationState ?? 'idle')
  const [isFocused, setIsFocused] = useState(false)

  // Update state from external prop
  useEffect(() => {
    if (externalValidationState) {
      setState(externalValidationState)
    }
  }, [externalValidationState])

  // Update character progress
  useEffect(() => {
    if (maxLength && value) {
      const progress = Math.min(value.length / maxLength, 1)
      characterProgress.value = withTiming(progress, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      })
    } else {
      characterProgress.value = 0
    }
  }, [value, maxLength, characterProgress])

  // Apply state animations
  useEffect(() => {
    const isReducedMotion = reducedMotion.value

    switch (state) {
      case 'idle':
        borderGlow.value = withTiming(0, { duration: 200 })
        borderColor.value = BORDER_COLORS.idle
        shakeOffset.value = 0
        break

      case 'focus':
        if (!isReducedMotion) {
          borderGlow.value = withSpring(BORDER_GLOW_FOCUS, {
            damping: 15,
            stiffness: 200,
          })
        } else {
          borderGlow.value = withTiming(BORDER_GLOW_FOCUS, { duration: 200 })
        }
        borderColor.value = BORDER_COLORS.focus

        if (enableHaptics && feedback.haptics) {
          triggerHaptic('light')
        }
        break

      case 'success':
        borderGlow.value = withTiming(0.5, { duration: 200 })
        borderColor.value = BORDER_COLORS.success

        if (enableHaptics && feedback.haptics) {
          triggerHaptic('success')
        }

        logger.debug('Input validation success')
        break

      case 'error':
        borderGlow.value = withTiming(0.8, { duration: 200 })
        borderColor.value = BORDER_COLORS.error

        // Shake animation
        if (!isReducedMotion) {
          shakeOffset.value = withSequence(
            withTiming(SHAKE_DISTANCE, { duration: 50 }),
            withTiming(-SHAKE_DISTANCE, { duration: 100 }),
            withTiming(SHAKE_DISTANCE * 0.5, { duration: 100 }),
            withTiming(-SHAKE_DISTANCE * 0.5, { duration: 100 }),
            withTiming(0, { duration: 50 })
          )
        }

        if (enableHaptics && feedback.haptics) {
          triggerHaptic('error')
        }

        logger.debug('Input validation error', { message: errorMessage })
        break

      case 'warning':
        borderGlow.value = withTiming(0.6, { duration: 200 })
        borderColor.value = BORDER_COLORS.warning

        if (enableHaptics && feedback.haptics) {
          triggerHaptic('warning')
        }

        logger.debug('Input validation warning')
        break
    }

    onValidationChange?.(state)
  }, [
    state,
    borderGlow,
    borderColor,
    shakeOffset,
    reducedMotion,
    enableHaptics,
    feedback.haptics,
    errorMessage,
    onValidationChange,
  ])

  // Handlers
  const onFocus = useCallback(() => {
    if (!enabled) {
      return
    }

    setIsFocused(true)
    setState('focus')

    // Animate label up
    labelOffset.value = withSpring(LABEL_OFFSET_FOCUSED, {
      damping: 15,
      stiffness: 200,
    })

    logger.debug('Input focused')
  }, [enabled, labelOffset])

  const onBlur = useCallback(() => {
    if (!enabled) {
      return
    }

    setIsFocused(false)

    // Return to idle if no validation state
    if (state === 'focus') {
      setState('idle')
    }

    // Animate label down if empty
    if (!value) {
      labelOffset.value = withSpring(LABEL_OFFSET_IDLE, {
        damping: 15,
        stiffness: 200,
      })
    }

    logger.debug('Input blurred')
  }, [enabled, value, state, labelOffset])

  const onChange = useCallback(
    (newValue: string) => {
      if (!enabled) {
        return
      }

      // Keep label up if has value
      if (newValue && labelOffset.value !== LABEL_OFFSET_FOCUSED) {
        labelOffset.value = withSpring(LABEL_OFFSET_FOCUSED, {
          damping: 15,
          stiffness: 200,
        })
      }

      // Check max length
      if (maxLength && newValue.length > maxLength) {
        if (enableHaptics && feedback.haptics) {
          triggerHaptic('error')
        }
      }
    },
    [enabled, maxLength, enableHaptics, feedback.haptics, labelOffset]
  )

  const setValidationState = useCallback(
    (newState: InputValidationState) => {
      if (!enabled) {
        return
      }
      setState(newState)
    },
    [enabled]
  )

  const animatedInputStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeOffset.value }],
      boxShadow: `0 0 ${borderGlow.value * 12}px ${borderColor.value}`,
    }
  })

  const animatedLabelStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: labelOffset.value }],
      fontSize: labelOffset.value === LABEL_OFFSET_FOCUSED ? 12 : 16,
    }
  })

  return {
    state,
    isFocused,
    borderGlow,
    labelOffset,
    shakeOffset,
    borderColor,
    characterProgress,
    animatedInputStyle,
    animatedLabelStyle,
    handlers: {
      onFocus,
      onBlur,
      onChange,
    },
    setValidationState,
  }
}
