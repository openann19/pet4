/**
 * Refresh control component with progress-based animations
 * Location: src/components/RefreshControl.tsx
 */

import React from 'react'
import { ActivityIndicator, StyleSheet, Text } from 'react-native'
import { Animated, Extrapolation, interpolate, useAnimatedStyle } from '@petspark/motion'
import type { UsePullToRefreshReturn } from '../hooks/use-pull-to-refresh'
import { colors } from '../theme/colors'

export interface RefreshControlProps {
  refreshing?: boolean
  translateY: UsePullToRefreshReturn['translateY']
  progress?: UsePullToRefreshReturn['progress'] | undefined
  threshold?: number | undefined
}

export function RefreshControl({
  refreshing = false,
  translateY,
  progress,
  threshold = 80,
}: RefreshControlProps): React.JSX.Element {
  const animatedStyle = useAnimatedStyle(() => {
    // Use progress if available, otherwise calculate from translateY
    const progressValue = progress?.value ?? Math.min(1, Math.max(0, translateY.value / threshold))

    const opacity = interpolate(progressValue, [0, 1], [0, 1], Extrapolation.CLAMP)

    const scale = interpolate(progressValue, [0, 0.5, 1], [0.8, 1, 1], Extrapolation.CLAMP)

    const rotation = interpolate(progressValue, [0, 1], [0, 360], Extrapolation.CLAMP)

    return {
      opacity,
      transform: [{ translateY: translateY.value }, { scale }, { rotate: `${rotation}deg` }],
    } as const
  })

  const textAnimatedStyle = useAnimatedStyle(() => {
    const progressValue = progress?.value ?? Math.min(1, Math.max(0, translateY.value / threshold))

    return {
      opacity: refreshing
        ? 0
        : interpolate(progressValue, [0, 0.3, 1], [0, 0.5, 1], Extrapolation.CLAMP),
    }
  })

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: refreshing ? 1 : 0,
    }
  })

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Animated.View style={indicatorAnimatedStyle}>
        <ActivityIndicator size="small" color={colors.accent} />
      </Animated.View>
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={styles.text}>Pull to refresh</Text>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -80,
    left: 0,
    right: 0,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  textContainer: {
    position: 'absolute',
  },
  text: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
})
