import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'

export interface AchievementBadgeProps {
  size?: number
  color?: string
  testID?: string
}

export function AchievementBadge({
  size = 32,
  color = '#3b82f6',
  testID = 'achievement-badge',
}: AchievementBadgeProps): React.JSX.Element {
  const scale = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    if (reducedMotion.value) {
      scale.value = withTiming(1, { duration: 200 })
    } else {
      scale.value = withSpring(1, { stiffness: 300, damping: 20 })
    }
  }, [scale, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
      testID={testID}
    />
  )
}

const styles = StyleSheet.create({
  badge: {
    // Base styles handled inline
  },
})

