/**
 * EnhancedButton - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/EnhancedButton.tsx
 *
 * Enhanced button component with haptic feedback, animations, and success/error states
 */

import React, { useCallback, useEffect } from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type TextStyle,
  type PressableProps,
} from 'react-native'
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'
import { springConfigs } from '@/effects/reanimated/transitions'
import { colors } from '@/theme/colors'
import { useReducedMotionSV } from '@petspark/motion'

const AnimatedView = Animated.createAnimatedComponent(View)

export interface EnhancedButtonProps extends Omit<PressableProps, 'onPress' className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)"> {
  title?: string
  children?: React.ReactNode
  onPress?: () => void | Promise<void>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'sm' | 'default' | 'lg' | 'icon'
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
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  ripple: _ripple = true,
  hapticFeedback = true,
  successAnimation = false,
  testID,
  ...pressableProps
}: EnhancedButtonProps): React.JSX.Element {
  const reducedMotion = useReducedMotionSV()
  const pressBounce = usePressBounce(reducedMotion.value ? 1 : 0.96)

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
    } catch (_error) {
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

  // Map web variant names to mobile
  const mobileVariant = variant === 'default' ? 'primary' : variant === 'link' ? 'ghost' : variant
  const mobileSize =
    size === 'default'
      ? 'md'
      : size === 'icon'
        ? 'md'
        : size === 'sm'
          ? 'sm'
          : size === 'lg'
            ? 'lg'
            : 'md'

  const containerStyles = [
    styles.container,
    styles[mobileVariant],
    styles[mobileSize],
    (disabled || loading) && styles.disabled,
    style,
  ]

  const textStyles = [
    styles.text,
    styles[`${mobileVariant}Text`],
    styles[`${mobileSize}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ]

  return (
    <AnimatedView style={[successAnimatedStyle, errorAnimatedStyle, opacityAnimatedStyle]}>
      <AnimatedView style={pressBounce.animatedStyle}>
        <Pressable
          style={containerStyles}
          onPress={() => {
            void handlePress()
          }}
          disabled={disabled || loading}
          testID={testID}
          {...pressableProps}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={
                mobileVariant === 'primary' || mobileVariant === 'destructive'
                  ? colors.textPrimary
                  : colors.primary
              }
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

  // Variants - using theme colors
  primary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  destructive: {
    backgroundColor: colors.danger,
    borderWidth: 0,
  },

  // Sizes - ensuring 44px minimum for accessibility
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    minWidth: 44,
  },
  md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    minWidth: 44,
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 56,
    minWidth: 44,
  },
  icon: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 44,
    minWidth: 44,
    width: 44,
    height: 44,
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
    color: colors.textPrimary,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.textPrimary,
  },
  destructiveText: {
    color: colors.textPrimary,
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
