import React from 'react'
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native'
import type { ViewStyle, TextStyle } from 'react-native'
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { MotionView } from '@petspark/motion'
import { haptics } from '@/lib/haptics'

interface UltraButtonProps {
  title: string
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function UltraButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}: UltraButtonProps) {
  const opacity = useSharedValue(1)

  const handlePress = () => {
    if (disabled || loading) return

    haptics.impact('light')
    opacity.value = withTiming(0.8, { duration: 100 }, () => {
      opacity.value = withTiming(1, { duration: 100 })
    })

    onPress?.()
  }

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const containerStyles = [
    styles.container,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ]

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ]

  return (
    <MotionView animatedStyle={animatedStyle}>
      <Pressable
        style={containerStyles}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? '#ffffff' : '#3b82f6'}
          />
        ) : (
          <>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <Text style={textStyles}>{title}</Text>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </>
        )}
      </Pressable>
    </MotionView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Variants
  primary: {
    backgroundColor: '#3b82f6',
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  destructive: {
    backgroundColor: '#ef4444',
    borderWidth: 0,
  },

  // Sizes
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 50,
  },
  xl: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 56,
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },

  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#374151',
  },
  outlineText: {
    color: '#3b82f6',
  },
  ghostText: {
    color: '#374151',
  },
  destructiveText: {
    color: '#ffffff',
  },

  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  xlText: {
    fontSize: 20,
  },

  disabledText: {
    opacity: 0.7,
  },

  // Icon styles
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
})
