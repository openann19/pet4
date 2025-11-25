/**
 * UltraButton - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/UltraButton.tsx
 */

import React, { useCallback, useRef, useEffect } from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  type ViewStyle,
  type PressableProps,
  type GestureResponderEvent,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'
import { springConfigs } from '@/effects/reanimated/transitions'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface UltraButtonProps extends PressableProps {
  children: React.ReactNode
  enableElastic?: boolean
  enableGlow?: boolean
  glowColor?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
}

export function UltraButton({
  children,
  enableElastic = true,
  enableGlow = false,
  glowColor = 'rgba(99, 102, 241, 0.5)',
  variant = 'default',
  size = 'md',
  onPress,
  style,
  ...props
}: UltraButtonProps): React.JSX.Element {
  const elastic = usePressBounce(0.96)
  const glowOpacity = useSharedValue(0)

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  const glowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (glowTimeoutRef.current !== null) {
        clearTimeout(glowTimeoutRef.current)
      }
    }
  }, [])

  const handlePress = useCallback(
    (event: GestureResponderEvent): void => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      if (enableGlow) {
        glowOpacity.value = withSpring(1, springConfigs.bouncy)
        if (glowTimeoutRef.current !== null) {
          clearTimeout(glowTimeoutRef.current)
        }
        glowTimeoutRef.current = setTimeout(() => {
          glowOpacity.value = withSpring(0, springConfigs.smooth)
          glowTimeoutRef.current = null
        }, 200)
      }
      onPress?.(event)
    },
    [enableGlow, glowOpacity, onPress]
  )

  const variantStyles: Record<string, ViewStyle> = {
    default: { backgroundColor: 'var(--color-accent-secondary-9)' },
    destructive: { backgroundColor: 'var(--color-error-9)' },
    outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: 'var(--color-accent-secondary-9)' },
    secondary: { backgroundColor: '#64748b' },
  }

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 40 },
    md: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 48 },
    lg: { paddingHorizontal: 32, paddingVertical: 16, minHeight: 56 },
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={enableElastic ? elastic.onPressIn : undefined}
      onPressOut={enableElastic ? elastic.onPressOut : undefined}
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        enableElastic && elastic.animatedStyle,
        enableGlow && styles.glow,
        style,
      ]}
      {...props}
    >
      {enableGlow && (
        <AnimatedPressable
          style={[styles.glowOverlay, { backgroundColor: glowColor }, glowStyle]}
        />
      )}
      {typeof children === 'string' ? <Text style={styles.text}>{children}</Text> : children}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: 'var(--color-bg-overlay)',
    zIndex: 1,
  },
})
