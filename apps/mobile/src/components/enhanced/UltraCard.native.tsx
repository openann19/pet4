/**
 * UltraCard - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/UltraCard.native.tsx
 */

import React, { useEffect } from 'react'
import { View, StyleSheet, type ViewStyle, type ViewProps } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { useHoverLift } from '@/effects/reanimated/use-hover-lift'
import { springConfigs } from '@/effects/reanimated/transitions'

const AnimatedView = Animated.createAnimatedComponent(View)

export interface UltraCardProps extends ViewProps {
  children: React.ReactNode
  index?: number
  enableReveal?: boolean
  enableHoverLift?: boolean
  enableGlow?: boolean
  glowColor?: string
  style?: ViewStyle
}

export function UltraCard({
  children,
  index = 0,
  enableReveal = true,
  enableHoverLift = true,
  enableGlow = false,
  glowColor = 'rgba(99, 102, 241, 0.4)',
  style,
  ...props
}: UltraCardProps): React.JSX.Element {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(30)
  const rotateY = useSharedValue(-12)
  const hoverLift = useHoverLift({ scale: 1.03, translateY: -6 })
  const glowOpacity = useSharedValue(0)

  useEffect(() => {
    if (enableReveal) {
      const delayMs = index * 50
      opacity.value = withDelay(delayMs, withTiming(1, { duration: 300 }))
      translateY.value = withDelay(delayMs, withSpring(0, springConfigs.smooth))
      rotateY.value = withDelay(delayMs, withSpring(0, springConfigs.smooth))
    } else {
      opacity.value = 1
      translateY.value = 0
      rotateY.value = 0
    }
  }, [enableReveal, index, opacity, translateY, rotateY])

  const revealStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { rotateY: `${rotateY.value}deg` },
    ],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  const combinedStyle = enableHoverLift
    ? [revealStyle, hoverLift.animatedStyle]
    : revealStyle

  return (
    <AnimatedView
      style={[
        styles.card,
        combinedStyle,
        enableGlow && styles.glow,
        style,
      ]}
      onTouchStart={enableHoverLift ? hoverLift.handleEnter : undefined}
      onTouchEnd={enableHoverLift ? hoverLift.handleLeave : undefined}
      {...props}
    >
      {enableGlow && (
        <AnimatedView
          style={[
            styles.glowOverlay,
            { backgroundColor: glowColor },
            glowStyle,
          ]}
        />
      )}
      {children}
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    opacity: 0.2,
  },
})
