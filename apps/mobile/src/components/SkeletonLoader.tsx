/**
 * Skeleton loading component
 * Location: src/components/SkeletonLoader.tsx
 */

import React from 'react'
import type { ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'
import {
  Animated,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from '@petspark/motion'

export interface SkeletonLoaderProps {
  width?: number
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function SkeletonLoader({
  width,
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonLoaderProps): React.JSX.Element {
  const shimmer = useSharedValue(0)

  React.useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false)
  }, [shimmer])

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3])

    return {
      opacity,
    }
  })

  return (
    <Animated.View
      style={[
        styles.skeleton,
        width !== undefined ? { width } : undefined,
        {
          height,
          borderRadius,
        },
        style,
        animatedStyle,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
})
