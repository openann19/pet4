'use client'

import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import type { ComponentProps } from 'react'

export interface ProgressProps extends ComponentProps<typeof View> {
  value?: number
  max?: number
}

export function Progress({
  value = 0,
  max = 100,
  style,
  ...props
}: ProgressProps): React.JSX.Element {
  const progress = useSharedValue(0)

  useEffect(() => {
    const normalizedValue = Math.max(0, Math.min(100, (value / max) * 100))
    progress.value = withTiming(normalizedValue, { duration: 500 })
  }, [value, max, progress])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    }
  })

  return (
    <View style={[styles.container, style]} {...props}>
      <View style={styles.track}>
        <AnimatedView style={[styles.indicator, animatedStyle]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  indicator: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
})
