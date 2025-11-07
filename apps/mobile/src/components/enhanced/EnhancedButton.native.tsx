/**
 * EnhancedButton - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/EnhancedButton.native.tsx
 * 
 * Enhanced button component with haptic feedback, animations, and success/error states
 */

import React, { useCallback, useEffect } from 'react'
import { Pressable, Text, StyleSheet, ActivityIndicator, View, type ViewStyle, type TextStyle, type PressableProps } from 'react-native'
import { useSharedValue, useAnimatedStyle, withTiming, withSequence, withSpring } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'
import { springConfigs } from '@/effects/reanimated/transitions'
import { isTruthy, isDefined } from '@/core/guards';

const AnimatedView = Animated.createAnimatedComponent(View)

export interface EnhancedButtonProps extends PressableProps {
  title?: string
  children?: React.ReactNode
  onPress?: () => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  ripple?: boolean
  hapticFeedback?: boolean
  successAnimation?: boolean
  testID?: string
}

export function EnhancedButton({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  ripple = true,
  hapticFeedback = true,
  successAnimation = false,
  testID,
  ...pressableProps
}: EnhancedButtonProps): React.JSX.Element {
  const pressBounce = usePressBounce(0.95)

  const successScale = useSharedValue(1)
  const errorShake = useSharedValue(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    successScale.value = 1
    errorShake.value = 0
  }, [successScale, errorShake])

  const isPromise = useCallback((value: unknown): value is Promise<unknown> => {
    return (
      value != null &&
      typeof value === 'object' &&
      'then' in value &&
      typeof (value as Promise<unknown>).then === 'function'
    )
  }, [])

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }))

  const errorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
  }))

  const opacityAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const handlePress = useCallback(async (): Promise<void> => {
    if (disabled || loading) return

    try {
      if (isTruthy(hapticFeedback)) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }

      pressBounce.onPressIn()

      if (isTruthy(onPress)) {
        const result = onPress()

        if (isPromise(result)) {
          await result

          if (isTruthy(successAnimation)) {
            successScale.value = withSequence(
              withSpring(1.1, springConfigs.bouncy),
              withSpring(1, springConfigs.smooth)
            )
            if (isTruthy(hapticFeedback)) {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            }
          }
        }
      }
    } catch (error) {
      // Extract error for logging if needed
      error instanceof Error ? error : new Error(String(error))
      errorShake.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      )
      if (isTruthy(hapticFeedback)) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      }
    } finally {
      pressBounce.onPressOut()
    }
  }, [
    disabled,
    loading,
    hapticFeedback,
    successAnimation,
    onPress,
    pressBounce,
    successScale,
    errorShake,
    isPromise,
  ])

  const containerStyles = [
    styles.container,
    styles[variant],
    styles[size],
    (disabled || loading) && styles.disabled,
    style,
  ]

  const textStyles = [
    styles.text,
    styles[`${String(variant ?? '')}Text`],
    styles[`${String(size ?? '')}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ]

  return (
    <AnimatedView style={[successAnimatedStyle, errorAnimatedStyle, opacityAnimatedStyle]}>
      <AnimatedView style={pressBounce.animatedStyle}>
        <Pressable
          style={containerStyles}
          onPress={handlePress}
          disabled={disabled || loading}
          testID={testID}
          {...pressableProps}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={variant === 'primary' || variant === 'destructive' ? '#ffffff' : '#3b82f6'}
            />
          ) : (
            <>
              {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
              {title && <Text style={textStyles}>{title}</Text>}
              {children && <Text style={textStyles}>{children}</Text>}
              {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </>
          )}
        </Pressable>
      </AnimatedView>
    </AnimatedView>
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
