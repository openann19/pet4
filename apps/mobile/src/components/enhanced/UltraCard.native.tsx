import React from 'react'
import { StyleSheet, Pressable } from 'react-native'
import type { ViewStyle } from 'react-native'
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { MotionView } from '@petspark/motion'

interface UltraCardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'elevated' | 'outlined' | 'filled'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  onPress?: () => void
}

export function UltraCard({
  children,
  style,
  variant = 'default',
  padding = 'md',
  onPress,
}: UltraCardProps) {
  const scale = useSharedValue(1)

  const handlePress = () => {
    if (onPress) {
      scale.value = withTiming(0.98, { duration: 100 }, () => {
        scale.value = withTiming(1, { duration: 100 })
      })
      onPress()
    }
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const cardStyles = StyleSheet.flatten([
    styles.container,
    styles[variant],
    styles[padding],
    style,
  ])

  const content = (
    <MotionView animatedStyle={animatedStyle} style={cardStyles}>
      {children}
    </MotionView>
  )

  if (onPress) {
    return (
      <Pressable onPress={handlePress} style={styles.pressable}>
        {content}
      </Pressable>
    )
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  pressable: {
    borderRadius: 16,
  },

  // Variants
  default: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  outlined: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filled: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },

  // Padding variants
  none: {
    padding: 0,
  },
  sm: {
    padding: 12,
  },
  md: {
    padding: 16,
  },
  lg: {
    padding: 20,
  },
  xl: {
    padding: 24,
  },
})
