import React, { useEffect } from 'react'
import { Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

export type GlowingBadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning'

export interface GlowingBadgeProps {
  children: React.ReactNode
  variant?: GlowingBadgeVariant
  glow?: boolean
  pulse?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  testID?: string
}

const VARIANT_COLORS: Record<
  GlowingBadgeVariant,
  { bg: string; text: string; border: string; glow: string }
> = {
  primary: {
    bg: 'rgba(59, 130, 246, 0.1)',
    text: 'var(--color-accent-secondary-9)',
    border: 'rgba(59, 130, 246, 0.2)',
    glow: 'rgba(59, 130, 246, 0.6)',
  },
  secondary: {
    bg: 'rgba(100, 116, 139, 0.1)',
    text: '#64748b',
    border: 'rgba(100, 116, 139, 0.2)',
    glow: 'rgba(100, 116, 139, 0.6)',
  },
  accent: {
    bg: 'rgba(139, 92, 246, 0.1)',
    text: '#8b5cf6',
    border: 'rgba(139, 92, 246, 0.2)',
    glow: 'rgba(139, 92, 246, 0.6)',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.1)',
    text: 'var(--color-success-9)',
    border: 'rgba(34, 197, 94, 0.2)',
    glow: 'rgba(34, 197, 94, 0.6)',
  },
  warning: {
    bg: 'rgba(234, 179, 8, 0.1)',
    text: 'var(--color-warning-9)',
    border: 'rgba(234, 179, 8, 0.2)',
    glow: 'rgba(234, 179, 8, 0.6)',
  },
}

export function GlowingBadge({
  children,
  variant = 'primary',
  glow = true,
  pulse = false,
  style,
  textStyle,
  testID = 'glowing-badge',
}: GlowingBadgeProps): React.JSX.Element {
  const scale = useSharedValue(0.8)
  const opacity = useSharedValue(0)
  const pulseOpacity = useSharedValue(0.5)
  const glowOpacity = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  const colors = VARIANT_COLORS[variant]

  useEffect(() => {
    if (isTruthy(reducedMotion.value)) {
      scale.value = withTiming(1, { duration: 200 })
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      scale.value = withTiming(1, { duration: 300 })
      opacity.value = withTiming(1, { duration: 300 })
    }
  }, [scale, opacity, reducedMotion])

  useEffect(() => {
    if (pulse && !reducedMotion.value) {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 1000 }), withTiming(0.5, { duration: 1000 })),
        -1,
        true
      )
    }
  }, [pulse, pulseOpacity, reducedMotion])

  useEffect(() => {
    if (glow && !reducedMotion.value) {
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.8, { duration: 2000 }), withTiming(0.4, { duration: 2000 })),
        -1,
        true
      )
    }
  }, [glow, glowOpacity, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * (pulse ? pulseOpacity.value : 1),
  }))

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
      testID={testID}
    >
      {glow && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: colors.glow,
            },
            glowStyle,
          ]}
        />
      )}
      <Text style={[styles.text, { color: colors.text }, textStyle]}>{children}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 14,
    opacity: 0.4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    zIndex: 1,
  },
})
