import { useSharedValue, useAnimatedStyle, withTiming } from '@petspark/motion'

/**
 * useRippleEffect hook
 * Creates a ripple/wave animation effect for touch feedback on mobile
 */
export function useRippleEffect(): {
  triggerRipple: () => void
  rippleStyle: ReturnType<typeof useAnimatedStyle>
} {
  const rippleScale = useSharedValue(0)
  const rippleOpacity = useSharedValue(0)

  const triggerRipple = (): void => {
    rippleScale.value = withTiming(1, { duration: 600 })
    rippleOpacity.value = withTiming(0, { duration: 600 })
  }

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }))

  return { triggerRipple, rippleStyle }
}
