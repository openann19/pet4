import { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, withDelay, type SharedValue } from 'react-native-reanimated'
import { useEffect } from 'react'
import type { AnimatedStyle } from './animated-view'

export interface UseHeaderAnimationOptions {
  delay?: number
}

export interface UseHeaderAnimationReturn {
  y: SharedValue<number>
  opacity: SharedValue<number>
  shimmerX: SharedValue<number>
  shimmerOpacity: SharedValue<number>
  headerStyle: AnimatedStyle
  shimmerStyle: AnimatedStyle
}

export function useHeaderAnimation(
  options: UseHeaderAnimationOptions = {}
): UseHeaderAnimationReturn {
  const { delay = 0.1 } = options

  const y = useSharedValue(-100)
  const opacity = useSharedValue(0)
  const shimmerX = useSharedValue(-100)
  const shimmerOpacity = useSharedValue(0)

  useEffect(() => {
    const delayMs = delay * 1000
    y.value = withDelay(delayMs, withTiming(0, { duration: 400 }))
    opacity.value = withDelay(delayMs, withTiming(1, { duration: 400 }))

    shimmerX.value = withRepeat(
      withSequence(
        withTiming(-100, { duration: 0 }),
        withTiming(100, { duration: 3000 })
      ),
      -1,
      false
    )

    shimmerOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(0.5, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      false
    )
  }, [delay, y, opacity, shimmerX, shimmerOpacity])

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: y.value }],
      opacity: opacity.value
    }
  }) as AnimatedStyle

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: shimmerX.value }
      ],
      opacity: shimmerOpacity.value
    }
  }) as AnimatedStyle

  return {
    y,
    opacity,
    shimmerX,
    shimmerOpacity,
    headerStyle,
    shimmerStyle
  }
}
