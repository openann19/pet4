import React, { useCallback, useState } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type GestureResponderEvent,
  type ViewProps,
  type TouchableOpacityProps,
} from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withTiming, withSequence } from '@petspark/motion'
import * as Haptics from 'expo-haptics'

export interface RippleEffectProps {
  color?: string
  opacity?: number
  duration?: number
  disabled?: boolean
  children?: React.ReactNode
  style?: ViewStyle
  testID?: string
  onPress?: (event: GestureResponderEvent) => void
}

export function RippleEffect({
  color = 'rgba(255, 255, 255, 0.5)',
  opacity = 0.5,
  duration = 600,
  disabled = false,
  children,
  style,
  testID = 'ripple-effect',
  onPress,
}: RippleEffectProps): React.JSX.Element {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const rippleScale = useSharedValue(0)
  const rippleOpacity = useSharedValue(opacity)

  const addRipple = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return

      const { locationX, locationY } = event.nativeEvent
      const id = Date.now()

      setRipples(prev => [...prev, { id, x: locationX, y: locationY }])

      rippleScale.value = 0
      rippleOpacity.value = opacity

      rippleScale.value = withTiming(4, { duration })
      rippleOpacity.value = withSequence(
        withTiming(opacity, { duration: duration / 3 }),
        withTiming(0, { duration: (duration * 2) / 3 })
      )

      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id))
      }, duration)

      if (onPress) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress(event)
      }
    },
    [disabled, duration, opacity, rippleScale, rippleOpacity, onPress]
  )

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }))

  const Component: React.ComponentType<ViewProps | TouchableOpacityProps> = onPress
    ? TouchableOpacity
    : View

  return (
    <Component
      onPress={onPress ? addRipple : undefined}
      style={[styles.container, style]}
      testID={testID}
      disabled={disabled}
    >
      {children}
      {ripples.map(ripple => (
        <Animated.View
          key={ripple.id}
          style={[
            styles.ripple,
            rippleStyle,
            {
              left: ripple.x,
              top: ripple.y,
              backgroundColor: color,
            },
          ]}
          pointerEvents="none"
        />
      ))}
    </Component>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
    marginTop: -10,
  },
})
