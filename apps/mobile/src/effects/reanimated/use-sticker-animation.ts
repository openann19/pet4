import { useCallback } from 'react'
import { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming, Easing } from '@petspark/motion'
import { springConfigs } from './transitions'

export type StickerAnimationType =
  | 'bounce'
  | 'spin'
  | 'pulse'
  | 'shake'
  | 'float'
  | 'grow'
  | 'wiggle'
  | 'flip'

export interface UseStickerAnimationOptions {
  animation?: StickerAnimationType | undefined
  enabled?: boolean
  duration?: number
  intensity?: number
}

export interface UseStickerAnimationReturn {
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  trigger: () => void
  reset: () => void
}

const DEFAULT_ENABLED = true
const DEFAULT_DURATION = 1000
const DEFAULT_INTENSITY = 1

export function useStickerAnimation(
  options: UseStickerAnimationOptions = {}
): UseStickerAnimationReturn {
  const {
    animation,
    enabled = DEFAULT_ENABLED,
    duration = DEFAULT_DURATION,
    intensity = DEFAULT_INTENSITY,
  } = options

  const scale = useSharedValue(1)
  const rotation = useSharedValue(0)
  const translateY = useSharedValue(0)
  const translateX = useSharedValue(0)
  const opacity = useSharedValue(1)

  const reset = useCallback(() => {
    scale.value = 1
    rotation.value = 0
    translateY.value = 0
    translateX.value = 0
    opacity.value = 1
  }, [scale, rotation, translateY, translateX, opacity])

  const trigger = useCallback(() => {
    if (!enabled || !animation) {
      return
    }

    reset()

    switch (animation) {
      case 'bounce': {
        scale.value = withSequence(
          withSpring(1.2 * intensity, springConfigs.bouncy),
          withSpring(1, springConfigs.smooth)
        )
        translateY.value = withSequence(
          withSpring(-10 * intensity, springConfigs.bouncy),
          withSpring(0, springConfigs.smooth)
        )
        break
      }

      case 'spin': {
        rotation.value = withRepeat(
          withTiming(360, {
            duration: duration / 2,
            easing: Easing.linear,
          }),
          -1,
          false
        )
        break
      }

      case 'pulse': {
        scale.value = withRepeat(
          withSequence(
            withTiming(1.15 * intensity, {
              duration: duration / 2,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
        break
      }

      case 'shake': {
        translateX.value = withRepeat(
          withSequence(
            withTiming(-8 * intensity, { duration: 50, easing: Easing.linear }),
            withTiming(8 * intensity, { duration: 50, easing: Easing.linear }),
            withTiming(-8 * intensity, { duration: 50, easing: Easing.linear }),
            withTiming(8 * intensity, { duration: 50, easing: Easing.linear }),
            withTiming(0, { duration: 50, easing: Easing.linear })
          ),
          1,
          false
        )
        break
      }

      case 'float': {
        translateY.value = withRepeat(
          withSequence(
            withTiming(-8 * intensity, {
              duration: duration / 2,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(0, {
              duration: duration / 2,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          true
        )
        break
      }

      case 'grow': {
        scale.value = withSequence(
          withSpring(1.3 * intensity, springConfigs.bouncy),
          withSpring(1, springConfigs.smooth)
        )
        break
      }

      case 'wiggle': {
        rotation.value = withRepeat(
          withSequence(
            withTiming(-15 * intensity, { duration: 100, easing: Easing.linear }),
            withTiming(15 * intensity, { duration: 100, easing: Easing.linear }),
            withTiming(-15 * intensity, { duration: 100, easing: Easing.linear }),
            withTiming(15 * intensity, { duration: 100, easing: Easing.linear }),
            withTiming(0, { duration: 100, easing: Easing.linear })
          ),
          1,
          false
        )
        break
      }

      case 'flip': {
        rotation.value = withSequence(
          withTiming(180, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(360, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: 0,
          })
        )
        break
      }

      default:
        break
    }
  }, [enabled, animation, duration, intensity, scale, rotation, translateY, translateX, reset])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${String(rotation.value ?? '')}deg` },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    }
  })

  return {
    animatedStyle,
    trigger,
    reset,
  }
}
