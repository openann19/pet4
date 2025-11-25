import { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withDelay, type SharedValue } from '@petspark/motion'
import { useCallback, useEffect } from 'react'
import type { MessageStatus } from '@mobile/lib/chat-types'
import { springConfigs, timingConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export interface UseReceiptTransitionOptions {
  status: MessageStatus
  previousStatus?: MessageStatus
  pulseDuration?: number
}

export interface UseReceiptTransitionReturn {
  opacity: SharedValue<number>
  scale: SharedValue<number>
  colorIntensity: SharedValue<number>
  iconRotation: SharedValue<number>
  animatedStyle: AnimatedStyle
  animateStatusChange: (newStatus: MessageStatus) => void
}

const DEFAULT_PULSE_DURATION = 600

export function useReceiptTransition(
  options: UseReceiptTransitionOptions
): UseReceiptTransitionReturn {
  const { status, previousStatus, pulseDuration = DEFAULT_PULSE_DURATION } = options

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
    [opacity, scale, colorIntensity, iconRotation, previousStatus, pulseDuration]
  )

  useEffect(() => {
    if (previousStatus && previousStatus !== status) {
      animateStatusChange(status)
    } else {
      if (status === 'read' || status === 'delivered') {
        colorIntensity.value = withTiming(1, timingConfigs.smooth)
      } else {
        colorIntensity.value = withTiming(0, timingConfigs.fast)
      }
    }
  }, [status, previousStatus, colorIntensity, animateStatusChange])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { rotate: `${iconRotation.value}deg` }],
      // For React Native, we need to return color as a separate style property
      // This will be applied to the Text component
    }
  }) as AnimatedStyle

  return {
    opacity,
    scale,
    colorIntensity,
    iconRotation,
    animatedStyle,
    animateStatusChange,
  }
}
