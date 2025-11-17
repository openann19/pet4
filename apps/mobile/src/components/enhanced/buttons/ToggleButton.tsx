import React, { useCallback } from 'react'
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface ToggleButtonProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  disabled?: boolean
  style?: ViewStyle
  testID?: string
  accessibilityLabel: string
}

const SPRING_CONFIG = { stiffness: 400, damping: 20 }

export function ToggleButton({
  checked = false,
  onCheckedChange,
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  style,
  testID = 'toggle-button',
  accessibilityLabel,
}: ToggleButtonProps): React.JSX.Element {
  const scale = useSharedValue(checked ? 1 : 0.95)
  const opacity = useSharedValue(checked ? 1 : 0.7)
  const reducedMotion = useReducedMotionSV()
  const pressBounce = usePressBounce(0.95)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const handlePress = useCallback(() => {
    if (isTruthy(disabled)) return

    const newChecked = !checked
    onCheckedChange?.(newChecked)

    if (isTruthy(reducedMotion.value)) {
      scale.value = withTiming(newChecked ? 1 : 0.95, { duration: 200 })
      opacity.value = withTiming(newChecked ? 1 : 0.7, { duration: 200 })
    } else {
      if (isTruthy(newChecked)) {
        scale.value = withSpring(1, SPRING_CONFIG)
        opacity.value = withSpring(1, SPRING_CONFIG)
      } else {
        scale.value = withSpring(0.95, SPRING_CONFIG)
        opacity.value = withSpring(0.7, SPRING_CONFIG)
      }
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [checked, disabled, onCheckedChange, scale, opacity, reducedMotion])

  const variantStyles: Record<string, ViewStyle> = {
    primary: checked
      ? { backgroundColor: 'var(--color-accent-secondary-9)' }
      : { backgroundColor: 'transparent', borderWidth: 2, borderColor: 'var(--color-accent-secondary-9)' },
    secondary: checked
      ? { backgroundColor: '#64748b' }
      : { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#64748b' },
    accent: checked
      ? { backgroundColor: '#8b5cf6' }
      : { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#8b5cf6' },
    ghost: checked ? { backgroundColor: 'rgba(0, 0, 0, 0.1)' } : { backgroundColor: 'transparent' },
  }

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: 12, paddingVertical: 6, minHeight: 44 },
    md: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 44 },
    lg: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 44 },
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={pressBounce.onPressIn}
      onPressOut={pressBounce.onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        pressBounce.animatedStyle,
        animatedStyle,
        style,
        disabled && styles.disabled,
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' && styles.textSm,
          size === 'md' && styles.textMd,
          size === 'lg' && styles.textLg,
          !checked && variant !== 'ghost' && styles.textUnchecked,
        ]}
      >
        {children}
      </Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontWeight: '600',
    color: 'var(--color-bg-overlay)',
  },
  textSm: {
    fontSize: 14,
  },
  textMd: {
    fontSize: 16,
  },
  textLg: {
    fontSize: 18,
  },
  textUnchecked: {
    color: 'var(--color-accent-secondary-9)',
  },
  disabled: {
    opacity: 0.5,
  },
})
