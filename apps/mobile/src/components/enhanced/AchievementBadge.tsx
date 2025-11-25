import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withSpring, withTiming } from '@petspark/motion'

export interface AchievementBadgeProps {
  size?: number
  color?: string
  testID?: string
}

export function AchievementBadge({
  size = 32,
  color = 'var(--color-accent-secondary-9)',
  testID = 'achievement-badge',
}: AchievementBadgeProps): React.JSX.Element {
  const scale = useSharedValue(0)

  useEffect(() => {
    scale.value = withSpring(1, { stiffness: 250, damping: 18 })
    const timeout = setTimeout(() => {
      scale.value = withTiming(0.95, { duration: 200 })
      scale.value = withSpring(1, { stiffness: 250, damping: 18 })
    }, 800)

    return () => {
      clearTimeout(timeout)
    }
  }, [scale])

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
