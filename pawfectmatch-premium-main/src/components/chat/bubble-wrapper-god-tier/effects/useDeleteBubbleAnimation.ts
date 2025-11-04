'use client'

import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  runOnUI,
  runOnJS,
  type SharedValue
} from 'react-native-reanimated'
import { useCallback } from 'react'
import { timingConfigs } from '@/effects/reanimated/transitions'
import { haptics } from '@/lib/haptics'

export type DeleteAnimationContext =
  | 'self-delete'
  | 'admin-delete'
  | 'emoji-media'
  | 'group-chat'

export interface UseDeleteBubbleAnimationOptions {
  onFinish?: () => void
  context?: DeleteAnimationContext
  hapticFeedback?: boolean
  duration?: number
}

export interface UseDeleteBubbleAnimationReturn {
  opacity: SharedValue<number>
  scale: SharedValue<number>
  translateY: SharedValue<number>
  translateX: SharedValue<number>
  height: SharedValue<number>
  rotation: SharedValue<number>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  triggerDelete: () => void
  reset: () => void
}

const DEFAULT_DURATION = 300
const DEFAULT_HAPTIC_FEEDBACK = true

export function useDeleteBubbleAnimation(
  options: UseDeleteBubbleAnimationOptions = {}
): UseDeleteBubbleAnimationReturn {
  const {
    onFinish,
    context = 'self-delete',
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    duration = DEFAULT_DURATION
  } = options

  const opacity = useSharedValue(1)
  const scale = useSharedValue(1)
  const translateY = useSharedValue(0)
  const translateX = useSharedValue(0)
  const height = useSharedValue(60)
  const rotation = useSharedValue(0)

  const triggerDelete = useCallback(() => {
    if (hapticFeedback) {
      haptics.impact(context === 'admin-delete' ? 'heavy' : 'medium')
    }

    runOnUI(() => {
      switch (context) {
        case 'self-delete': {
          scale.value = withSequence(
            withTiming(1.1, { duration: duration * 0.1, easing: timingConfigs.smooth.easing }),
            withTiming(0, { duration: duration * 0.9, easing: timingConfigs.smooth.easing })
          )
          translateY.value = withTiming(-40, {
            duration,
            easing: timingConfigs.smooth.easing
          })
          opacity.value = withTiming(0, {
            duration,
            easing: timingConfigs.smooth.easing
          })
          height.value = withTiming(
            0,
            { duration },
            (finished) => {
              if (finished && onFinish) {
                runOnJS(onFinish)()
              }
            }
          )
          break
        }

        case 'admin-delete': {
          scale.value = withSequence(
            withTiming(1.15, { duration: duration * 0.2 }),
            withTiming(0.8, { duration: duration * 0.3 }),
            withTiming(0, { duration: duration * 0.5 })
          )
          translateX.value = withSequence(
            withTiming(10, { duration: duration * 0.2 }),
            withTiming(-10, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.6 })
          )
          translateY.value = withTiming(0, { duration: duration * 0.5 })
          opacity.value = withSequence(
            withTiming(0.7, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          )
          height.value = withTiming(
            0,
            { duration },
            (finished) => {
              if (finished && onFinish) {
                runOnJS(onFinish)()
              }
            }
          )
          rotation.value = withSequence(
            withTiming(5, { duration: duration * 0.2 }),
            withTiming(-5, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.6 })
          )
          break
        }

        case 'emoji-media': {
          scale.value = withSequence(
            withTiming(1.2, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          )
          opacity.value = withSequence(
            withTiming(0.8, { duration: duration * 0.2 }),
            withTiming(0, { duration: duration * 0.8 })
          )
          height.value = withTiming(
            0,
            { duration },
            (finished) => {
              if (finished && onFinish) {
                runOnJS(onFinish)()
              }
            }
          )
          rotation.value = withTiming(
            Math.random() > 0.5 ? 15 : -15,
            { duration }
          )
          break
        }

        case 'group-chat': {
          scale.value = withTiming(0.95, { duration: duration * 0.3 })
          opacity.value = withSequence(
            withTiming(0.5, { duration: duration * 0.3 }),
            withTiming(0, { duration: duration * 0.7 })
          )
          height.value = withTiming(
            0,
            { duration },
            (finished) => {
              if (finished && onFinish) {
                runOnJS(onFinish)()
              }
            }
          )
          break
        }

        default: {
          scale.value = withTiming(0, { duration })
          opacity.value = withTiming(0, { duration })
          height.value = withTiming(
            0,
            { duration },
            (finished) => {
              if (finished && onFinish) {
                runOnJS(onFinish)()
              }
            }
          )
        }
      }
    })()
  }, [
    context,
    duration,
    hapticFeedback,
    onFinish,
    opacity,
    scale,
    translateY,
    translateX,
    height,
    rotation
  ])

  const reset = useCallback(() => {
    runOnUI(() => {
      opacity.value = 1
      scale.value = 1
      translateY.value = 0
      translateX.value = 0
      height.value = 60
      rotation.value = 0
    })()
  }, [opacity, scale, translateY, translateX, height, rotation])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotation.value}deg` }
      ],
      height: height.value,
      overflow: 'hidden' as const
    }
  })

  return {
    opacity,
    scale,
    translateY,
    translateX,
    height,
    rotation,
    animatedStyle,
    triggerDelete,
    reset
  }
}

