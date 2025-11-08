import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { useCallback, useRef } from 'react'
import { springConfigs, timingConfigs } from './transitions'
import type { AnimatedStyle } from './animated-view'

export interface UseTimestampRevealOptions {
  autoHideDelay?: number
  enabled?: boolean
}

export interface UseTimestampRevealReturn {
  opacity: SharedValue<number>
  translateY: SharedValue<number>
  animatedStyle: AnimatedStyle
  show: () => void
  hide: () => void
}

const DEFAULT_AUTO_HIDE_DELAY = 3000
const DEFAULT_ENABLED = true

export function useTimestampReveal(
  options: UseTimestampRevealOptions = {}
): UseTimestampRevealReturn {
  const { autoHideDelay = DEFAULT_AUTO_HIDE_DELAY, enabled = DEFAULT_ENABLED } = options

  const opacity = useSharedValue(0)
  const translateY = useSharedValue(10)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback(() => {
    if (!enabled) {
      return
    }

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = undefined as unknown as ReturnType<typeof setTimeout>
    }

    opacity.value = withSpring(1, springConfigs.smooth)
    translateY.value = withSpring(0, springConfigs.smooth)

    hideTimeoutRef.current = setTimeout(() => {
      opacity.value = withTiming(0, timingConfigs.fast)
      translateY.value = withTiming(10, timingConfigs.fast)
    }, autoHideDelay)
  }, [enabled, autoHideDelay, opacity, translateY])

  const hide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = undefined as unknown as ReturnType<typeof setTimeout>
    }

    opacity.value = withTiming(0, timingConfigs.fast)
    translateY.value = withTiming(10, timingConfigs.fast)
  }, [opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }
  }) as AnimatedStyle

  return {
    opacity,
    translateY,
    animatedStyle,
    show,
    hide,
  }
}
