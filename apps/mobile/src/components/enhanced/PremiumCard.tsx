/**
 * PremiumCard - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/PremiumCard.tsx
 */

import React, { useEffect } from 'react'
import { View, StyleSheet, type ViewStyle, type ViewProps } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withTiming, withSpring } from '@petspark/motion'
import { useHoverLift, useGlowPulse } from '@mobile/effects/reanimated'

const AnimatedView = Animated.createAnimatedComponent(View)

export interface PremiumCardProps extends ViewProps {
  variant?: 'default' | 'glass' | 'elevated' | 'gradient'
  hover?: boolean
  glow?: boolean
  children?: React.ReactNode
  style?: ViewStyle
}

const CARD_VARIANTS: Record<string, ViewStyle> = {
  default: {
    backgroundColor: 'var(--color-bg-overlay)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  elevated: {
    backgroundColor: 'var(--color-bg-overlay)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    backgroundColor: 'var(--color-accent-secondary-9)',
    borderWidth: 0,
  },
}

export function PremiumCard({
  variant = 'default',
  hover = true,
  glow = false,
  children,
  style,
  ...props
}: PremiumCardProps): React.JSX.Element {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const hoverLift = useHoverLift({ scale: 1.02, translateY: -4, hapticFeedback: true })
  const glowPulse = useGlowPulse({
    enabled: glow,
    color: 'var(--color-accent-secondary-9)',
    intensity: 1.2,
  })

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 220 })
    translateY.value = withSpring(0, { stiffness: 300, damping: 25 })
  }, [opacity, translateY])

  const entryStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const combinedStyle = hover ? [entryStyle, hoverLift.animatedStyle] : entryStyle

  const variantStyle = CARD_VARIANTS[variant] || CARD_VARIANTS['default']
  const glowStyle = glow ? glowPulse.animatedStyle : undefined

  return (
    <AnimatedView
      style={[styles.card, variantStyle, glow && styles.glow, combinedStyle, glowStyle, style]}
      onTouchStart={hover ? hoverLift.handlePressIn : undefined}
      onTouchEnd={hover ? hoverLift.handlePressOut : undefined}
      {...props}
    >
      {children}
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 24,
    minHeight: 100,
  },
  glow: {
    shadowColor: 'var(--color-accent-secondary-9)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
})
