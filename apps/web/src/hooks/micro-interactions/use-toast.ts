/**
 * Toast Notification Hook (Web)
 *
 * Provides premium toast notifications with:
 * - Slide in/out animations
 * - Multiple variants (success, error, warning, info)
 * - Haptic feedback
 * - Sound effects (optional)
 * - Auto-dismiss with progress bar
 * - Queue management
 * - Reduced motion support
 *
 * Location: apps/web/src/hooks/micro-interactions/use-toast.ts
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  // withDelay,
  type SharedValue,
} from '@petspark/motion'
import { createLogger } from '@/lib/logger'
import { triggerHaptic } from '@/effects/chat/core/haptic-manager'
import { useReducedMotionSV } from '@/effects/chat/core/reduced-motion'
import { useUIConfig } from '@/hooks/use-ui-config'

const logger = createLogger('toast')

/**
 * Toast variant type
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

/**
 * Toast position
 */
export type ToastPosition = 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/**
 * Toast configuration
 */
export interface ToastConfig {
  readonly id: string
  readonly variant: ToastVariant
  readonly title: string
  readonly message?: string
  readonly duration?: number // ms, 0 = manual dismiss
  readonly position?: ToastPosition
  readonly enableHaptics?: boolean
  readonly enableSound?: boolean
  readonly onDismiss?: () => void
}

/**
 * Toast state
 */
interface ToastState extends ToastConfig {
  readonly createdAt: number
}

/**
 * Toast hook options
 */
export interface UseToastOptions {
  readonly maxToasts?: number
  readonly defaultDuration?: number // ms
  readonly defaultPosition?: ToastPosition
  readonly enableHaptics?: boolean
  readonly enableSound?: boolean
}

/**
 * Toast return type
 */
export interface UseToastReturn {
  readonly toasts: readonly ToastState[]
  readonly show: (config: Omit<ToastConfig, 'id'>) => string
  readonly dismiss: (id: string) => void
  readonly dismissAll: () => void
}

/**
 * Single toast animation hook
 */
export interface UseToastAnimationOptions {
  readonly toast: ToastState
  readonly index: number
  readonly onDismissComplete: (id: string) => void
}

export interface UseToastAnimationReturn {
  readonly translateY: SharedValue<number>
  readonly opacity: SharedValue<number>
  readonly scale: SharedValue<number>
  readonly progress: SharedValue<number>
  readonly animatedStyle: ReturnType<typeof useAnimatedStyle>
  readonly progressStyle: ReturnType<typeof useAnimatedStyle>
}

const DEFAULT_MAX_TOASTS = 3
const DEFAULT_DURATION = 4000 // ms
const DEFAULT_POSITION: ToastPosition = 'bottom'
const TOAST_HEIGHT = 80 // px
const TOAST_SPACING = 12 // px

let toastIdCounter = 0

export function useToast(options: UseToastOptions = {}): UseToastReturn {
  const {
    maxToasts = DEFAULT_MAX_TOASTS,
    defaultDuration = DEFAULT_DURATION,
    defaultPosition = DEFAULT_POSITION,
    enableHaptics = true,
    enableSound = false,
  } = options

  const { feedback } = useUIConfig()
  const [toasts, setToasts] = useState<readonly ToastState[]>([])

  const show = useCallback(
    (config: Omit<ToastConfig, 'id'>): string => {
      const id = `toast-${++toastIdCounter}`

      const toast: ToastState = {
        id,
        variant: config.variant,
        title: config.title,
        message: config.message,
        duration: config.duration ?? defaultDuration,
        position: config.position ?? defaultPosition,
        enableHaptics: config.enableHaptics ?? enableHaptics,
        enableSound: config.enableSound ?? enableSound,
        onDismiss: config.onDismiss,
        createdAt: Date.now(),
      }

      setToasts((prev) => {
        const newToasts = [...prev, toast]
        // Keep only max toasts, remove oldest
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts)
        }
        return newToasts
      })

      // Haptic feedback
      if (toast.enableHaptics && feedback.haptics) {
        switch (toast.variant) {
          case 'success':
            triggerHaptic('success')
            break
          case 'error':
            triggerHaptic('error')
            break
          case 'warning':
            triggerHaptic('warning')
            break
          default:
            triggerHaptic('light')
        }
      }

      logger.debug('Toast shown', { id, variant: toast.variant, title: toast.title })

      return id
    },
    [defaultDuration, defaultPosition, enableHaptics, enableSound, maxToasts, feedback.haptics]
  )

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    logger.debug('Toast dismissed', { id })
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
    logger.debug('All toasts dismissed')
  }, [])

  return {
    toasts,
    show,
    dismiss,
    dismissAll,
  }
}

/**
 * Animation hook for individual toast
 */
export function useToastAnimation(
  options: UseToastAnimationOptions
): UseToastAnimationReturn {
  const { toast, index, onDismissComplete } = options

  const reducedMotion = useReducedMotionSV()

  // Animation values
  const translateY = useSharedValue(100) // Start off-screen
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.9)
  const progress = useSharedValue(0)

  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const isReducedMotion = reducedMotion.value

    // Enter animation
    if (!isReducedMotion) {
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      })
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      })
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      })
    } else {
      translateY.value = withTiming(0, { duration: 200 })
      opacity.value = withTiming(1, { duration: 200 })
      scale.value = 1
    }

    // Progress bar animation
    if (toast.duration && toast.duration > 0) {
      progress.value = withTiming(1, {
        duration: toast.duration,
        easing: Easing.linear,
      })

      // Auto-dismiss
      dismissTimerRef.current = setTimeout(() => {
        // Exit animation
        if (!isReducedMotion) {
          translateY.value = withSpring(-100, {
            damping: 20,
            stiffness: 300,
          })
          opacity.value = withTiming(0, {
            duration: 200,
            easing: Easing.in(Easing.ease),
          })
          scale.value = withSpring(0.9, {
            damping: 15,
            stiffness: 200,
          })
        } else {
          opacity.value = withTiming(0, { duration: 150 })
        }

        // Complete dismiss after animation
        setTimeout(() => {
          onDismissComplete(toast.id)
          toast.onDismiss?.()
        }, 300)
      }, toast.duration)
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current)
      }
    }
  }, [
    toast,
    translateY,
    opacity,
    scale,
    progress,
    reducedMotion,
    onDismissComplete,
  ])

  const animatedStyle = useAnimatedStyle(() => {
    // Stack toasts with offset
    const yOffset = index * (TOAST_HEIGHT + TOAST_SPACING)

    return {
      transform: [
        { translateY: translateY.value + yOffset },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    }
  })

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    }
  })

  return {
    translateY,
    opacity,
    scale,
    progress,
    animatedStyle,
    progressStyle,
  }
}
