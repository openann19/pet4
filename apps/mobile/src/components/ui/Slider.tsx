/**
 * Mobile Slider Component
 * Location: apps/mobile/src/components/ui/Slider.tsx
 */

import React, { useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import * as Haptics from 'expo-haptics'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export interface SliderProps {
  min?: number
  max?: number
  value?: number
  onValueChange?: (value: number) => void
  step?: number
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function Slider({
  min = 0,
  max = 100,
  value: externalValue,
  onValueChange,
  step = 1,
  disabled = false,
  style,
}: SliderProps): React.JSX.Element {
  const [internalValue, setInternalValue] = useState((min + max) / 2)
  const reduced = useReducedMotionSV()

  const value = externalValue ?? internalValue
  const percentage = ((value - min) / (max - min)) * 100

  const thumbPosition = useSharedValue(percentage)
  const isDragging = useSharedValue(false)

  const handleValueChange = useCallback(
    (newValue: number) => {
      const clamped = Math.max(min, Math.min(max, newValue))
      const stepped = Math.round(clamped / step) * step

      if (externalValue === undefined) {
        setInternalValue(stepped)
      }
      onValueChange?.(stepped)

      if (!reduced) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      }
    },
    [min, max, step, externalValue, onValueChange, reduced]
  )

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => {
      isDragging.value = true
    },
    onPanResponderMove: (_, gesture) => {
      const trackWidth = SCREEN_WIDTH - 80 // Account for padding
      const newX = Math.max(0, Math.min(trackWidth, gesture.moveX - 40))
      const newPercentage = (newX / trackWidth) * 100
      const newValue = min + (newPercentage / 100) * (max - min)

      thumbPosition.value = newPercentage
      runOnJS(handleValueChange)(newValue)
    },
    onPanResponderRelease: () => {
      isDragging.value = false
    },
  })

  const animatedThumbStyle = useAnimatedStyle(() => ({
    left: `${thumbPosition.value}%`,
    transform: [{ scale: isDragging.value ? 1.2 : 1 }],
  }))

  const animatedTrackStyle = useAnimatedStyle(() => ({
    width: `${thumbPosition.value}%`,
  }))

  return (
    <View style={[styles.container, style]}>
      <View style={styles.track}>
        <Animated.View style={[styles.trackFill, animatedTrackStyle]} />
      </View>
      <Animated.View style={[styles.thumb, animatedThumbStyle]} {...panResponder.panHandlers} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  track: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    left: -12,
    top: 8,
  },
})
