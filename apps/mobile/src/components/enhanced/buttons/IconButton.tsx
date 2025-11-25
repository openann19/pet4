import React, { useCallback, useRef, useEffect } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withTiming, withSequence } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface IconButtonProps {
  icon: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'ghost' | 'outline' | 'glass'
  enableRipple?: boolean
  enableGlow?: boolean
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
  testID?: string
  accessibilityLabel: string
}

const SIZE_CONFIG = {
  sm: { size: 32, iconSize: 16, padding: 8 },
  md: { size: 44, iconSize: 20, padding: 12 },
  lg: { size: 56, iconSize: 24, padding: 16 },
} as const

export function IconButton({
  icon,
  size = 'md',
  variant = 'primary',
  enableRipple = true,
  enableGlow = false,
  onPress,
  disabled = false,
  style,
  testID = 'icon-button',
  accessibilityLabel,
}: IconButtonProps): React.JSX.Element {
  const glowOpacity = useSharedValue(0)
  const isActive = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()
  const pressBounce = usePressBounce(0.9)
  const activeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (activeTimeoutRef.current !== null) {
        clearTimeout(activeTimeoutRef.current)
      }
    }
  }, [])

  const handlePress = useCallback(() => {
    if (isTruthy(disabled)) return

    if (enableRipple) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    if (isTruthy(reducedMotion.value)) {
      isActive.value = withTiming(1, { duration: 100 })
      if (activeTimeoutRef.current !== null) {
        clearTimeout(activeTimeoutRef.current)
      }
      activeTimeoutRef.current = setTimeout(() => {
        isActive.value = withTiming(0, { duration: 100 })
        activeTimeoutRef.current = null
      }, 100)
    } else {
      isActive.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 200 })
      )
    }

    onPress?.()
  }, [disabled, enableRipple, onPress, isActive, reducedMotion])

  const glowStyle = useAnimatedStyle(() => {
    if (!enableGlow) return {}
    return {
      opacity: glowOpacity.value,
    }
  })

  const activeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - isActive.value * 0.1 }],
  }))

  const config = SIZE_CONFIG[size]

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: 'var(--color-accent-secondary-9)' },
    ghost: { backgroundColor: 'transparent' },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: 'var(--color-accent-secondary-9)',
    },
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={pressBounce.onPressIn}
      onPressOut={pressBounce.onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
        },
        variantStyles[variant],
        pressBounce.animatedStyle,
        activeStyle,
        style,
        disabled && styles.disabled,
      ]}
      testID={testID}
    >
      {enableGlow && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: config.size / 2,
              backgroundColor: 'rgba(59, 130, 246, 0.3)',
            },
            glowStyle,
          ]}
          pointerEvents="none"
        />
      )}
      <View
        style={[
          styles.iconContainer,
          {
            width: config.iconSize,
            height: config.iconSize,
          },
        ]}
      >
        {icon}
      </View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
})
