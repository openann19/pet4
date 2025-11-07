import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated'
import { useCallback, useEffect } from 'react'
import type { MessageStatus } from '@/lib/chat-types'
import { springConfigs, timingConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export type { MessageStatus }

export interface UseReceiptTransitionOptions {
  readonly status: MessageStatus
  readonly previousStatus?: MessageStatus
  readonly pulseDuration?: number
}

export interface UseReceiptTransitionReturn {
  readonly opacity: SharedValue<number>
  readonly scale: SharedValue<number>
  readonly colorIntensity: SharedValue<number>
  readonly iconRotation: SharedValue<number>
  readonly animatedStyle: AnimatedStyle
  readonly animateStatusChange: (newStatus: MessageStatus) => void
}

const DEFAULT_PULSE_DURATION = 600

const STATUS_COLORS = {
  sending: 'rgba(156, 163, 175, 1)',
  sent: 'rgba(156, 163, 175, 1)',
  delivered: 'rgba(96, 165, 250, 1)',
  read: 'rgba(59, 130, 246, 1)',
  failed: 'rgba(239, 68, 68, 1)',
} as const

export function useReceiptTransition(options: UseReceiptTransitionOptions): UseReceiptTransitionReturn {
  const {
    status,
    previousStatus,
    pulseDuration = DEFAULT_PULSE_DURATION,
  } = options

  const opacity = useSharedValue(1)
  const scale = useSharedValue(1)
  const colorIntensity = useSharedValue(status === 'read' || status === 'delivered' ? 1 : 0)
  const iconRotation = useSharedValue(0)

  const animateStatusChange = useCallback(
    (newStatus: MessageStatus) => {
      opacity.value = withSequence(
        withTiming(0.6, { duration: pulseDuration / 3 }),
        withTiming(1, { duration: pulseDuration / 3 })
      )

      scale.value = withSequence(
        withSpring(1.3, {
          damping: 10,
          stiffness: 400,
        }),
        withSpring(1, springConfigs.bouncy)
      )

      iconRotation.value = withSequence(
        withTiming(-10, { duration: pulseDuration / 4 }),
        withSpring(0, springConfigs.bouncy)
      )

      if (newStatus === 'read' && previousStatus === 'delivered') {
        colorIntensity.value = withSequence(
          withTiming(0, { duration: 100 }),
          withDelay(50, withTiming(1, { duration: pulseDuration / 2 }))
        )
      } else if (newStatus === 'delivered') {
        colorIntensity.value = withTiming(1, timingConfigs.smooth)
      } else if (newStatus === 'read') {
        colorIntensity.value = withTiming(1, timingConfigs.smooth)
      } else if (newStatus === 'sent' || newStatus === 'sending') {
        colorIntensity.value = withTiming(0, timingConfigs.fast)
      }
    },
    [colorIntensity, iconRotation, opacity, previousStatus, pulseDuration, scale]
  )

  useEffect(() => {
    if (previousStatus && previousStatus !== status) {
      animateStatusChange(status)
    } else if (status === 'read' || status === 'delivered') {
      colorIntensity.value = withTiming(1, timingConfigs.smooth)
    } else {
      colorIntensity.value = withTiming(0, timingConfigs.fast)
    }
  }, [animateStatusChange, colorIntensity, previousStatus, status])

  const animatedStyle = useAnimatedStyle(() => {
    const baseColor = STATUS_COLORS.sent
    const targetColor = STATUS_COLORS[status] ?? STATUS_COLORS.sending

    const r = interpolate(
      colorIntensity.value,
      [0, 1],
      [
        parseInt(/rgba?\((\d+)/.exec(baseColor)?.[1] ?? '156', 10),
        parseInt(/rgba?\((\d+)/.exec(targetColor)?.[1] ?? '156', 10),
      ],
      Extrapolation.CLAMP
    )

    const g = interpolate(
      colorIntensity.value,
      [0, 1],
      [
        parseInt(/rgba?\(\d+, (\d+)/.exec(baseColor)?.[1] ?? '163', 10),
        parseInt(/rgba?\(\d+, (\d+)/.exec(targetColor)?.[1] ?? '163', 10),
      ],
      Extrapolation.CLAMP
    )

    const b = interpolate(
      colorIntensity.value,
      [0, 1],
      [
        parseInt(/rgba?\(\d+, \d+, (\d+)/.exec(baseColor)?.[1] ?? '175', 10),
        parseInt(/rgba?\(\d+, \d+, (\d+)/.exec(targetColor)?.[1] ?? '175', 10),
      ],
      Extrapolation.CLAMP
    )

    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { rotate: `${String(iconRotation.value ?? '')}deg` },
      ],
      color: `rgb(${String(Math.round(r) ?? '')}, ${String(Math.round(g) ?? '')}, ${String(Math.round(b) ?? '')})`,
    } satisfies AnimatedStyle
  })

  return {
    opacity,
    scale,
    colorIntensity,
    iconRotation,
    animatedStyle,
    animateStatusChange,
  }
}
