import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { useCallback } from 'react'

export interface UseBounceOnTapOptions {
  scale?: number
}

export interface UseBounceOnTapReturn {
  handlePressIn: () => void
  handlePressOut: () => void
  handlePress: () => void
  animatedStyle: ReturnType<typeof useAnimatedStyle>
  scale: ReturnType<typeof useSharedValue<number>>
}

export function useBounceOnTap(options?: UseBounceOnTapOptions): UseBounceOnTapReturn {
  const scaleValue = options?.scale ?? 0.95
  const scale = useSharedValue(1)

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 200 })
  }, [scale, scaleValue])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 })
  }, [scale])

  const handlePress = useCallback(() => {
    handlePressIn()
    setTimeout(() => handlePressOut(), 150)
  }, [handlePressIn, handlePressOut])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return {
    handlePressIn,
    handlePressOut,
    handlePress,
    animatedStyle,
    scale,
  }
}
