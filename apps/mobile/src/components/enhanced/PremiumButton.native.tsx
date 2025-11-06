import React, { useCallback } from 'react'
import { Pressable, Text, StyleSheet, ActivityIndicator, View, type ViewStyle, type TextStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PremiumButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
  testID?: string
}

export function PremiumButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  children,
  onPress,
  disabled = false,
  style,
  testID = 'premium-button',
}: PremiumButtonProps): React.JSX.Element {
  const pressBounce = usePressBounce(0.95)

  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress?.()
    }
  }, [disabled, loading, onPress])

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: '#3b82f6' },
    secondary: { backgroundColor: '#64748b' },
    accent: { backgroundColor: '#8b5cf6' },
    ghost: { backgroundColor: 'transparent' },
    gradient: { backgroundColor: '#3b82f6' }, // Simplified for mobile
  }

  const sizeStyles: Record<string, { paddingHorizontal: number; paddingVertical: number; minHeight: number }> = {
    sm: { paddingHorizontal: 12, paddingVertical: 6, minHeight: 44 },
    md: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 44 },
    lg: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 44 },
  }

  const textSizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={pressBounce.onPressIn}
      onPressOut={pressBounce.onPressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        pressBounce.animatedStyle,
        style,
        (disabled || loading) && styles.disabled,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, textSizeStyles[size], variant === 'ghost' && styles.ghostText]}>
            {children}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.icon}>{icon}</View>}
        </View>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
  },
  ghostText: {
    color: '#64748b',
  },
  icon: {
    // Icon container
  },
  disabled: {
    opacity: 0.5,
  },
})

