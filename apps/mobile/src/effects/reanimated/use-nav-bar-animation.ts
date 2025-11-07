import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence, withDelay, type SharedValue } from 'react-native-reanimated'
import { useEffect } from 'react'
import { springConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export interface UseNavBarAnimationOptions {
  delay?: number
}

export interface UseNavBarAnimationReturn {
  opacity: SharedValue<number>
  translateY: SharedValue<number>
  scale: SharedValue<number>
  navStyle: AnimatedStyle
  shimmerTranslateX: SharedValue<number>
  shimmerOpacity: SharedValue<number>
  shimmerStyle: AnimatedStyle
}

export function useNavBarAnimation(
  options: UseNavBarAnimationOptions = {}
): UseNavBarAnimationReturn {
  const { delay = 200 } = options

  const opacity = useSharedValue(0)
  const translateY = useSharedValue(100)
  const scale = useSharedValue(0.95)
  const shimmerTranslateX = useSharedValue(-100)
  const shimmerOpacity = useSharedValue(0)

  useEffect(() => {
    const delayMs = delay
    opacity.value = withDelay(delayMs, withSpring(1, springConfigs.smooth))
    translateY.value = withDelay(delayMs, withSpring(0, springConfigs.smooth))
    scale.value = withDelay(delayMs, withTiming(1, { duration: 300 }))

    shimmerTranslateX.value = withRepeat(
      withSequence(
        withTiming(100, { duration: 0 }),
        withTiming(100, { duration: 4000 })
      ),
      -1,
      false
    )
    shimmerOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(0.4, { duration: 1000 }),
        withTiming(0.4, { duration: 2000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    )
  }, [delay, opacity, translateY, scale, shimmerTranslateX, shimmerOpacity])

  const navStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }
  }) as AnimatedStyle

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslateX.value }],
      opacity: shimmerOpacity.value,
    }
  }) as AnimatedStyle

  return {
    opacity,
    translateY,
    scale,
    navStyle,
    shimmerTranslateX,
    shimmerOpacity,
    shimmerStyle,
  }
}
