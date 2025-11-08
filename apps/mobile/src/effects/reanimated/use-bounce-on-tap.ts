import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useCallback } from 'react'

export interface UseBounceOnTapReturn {
  handlePressIn: () => void
  handlePressOut: () => void
  animatedStyle: ReturnType<typeof useAnimatedStyle>
}

export function useBounceOnTap(): UseBounceOnTapReturn {
  const scale = useSharedValue(1)

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 200 })
  }, [scale])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 })
  }, [scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return {
    handlePressIn,
    handlePressOut,
    animatedStyle,
  }
}
