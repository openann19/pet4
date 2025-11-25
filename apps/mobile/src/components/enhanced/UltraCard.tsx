/**
 * UltraCard - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/UltraCard.tsx
 */

import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, type ViewStyle, type ViewProps } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Animated, useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from '@petspark/motion'
import { useHoverLift, useGlowPulse, useParallaxTilt } from '@mobile/effects/reanimated'
import { springConfigs } from '@mobile/effects/reanimated/transitions'

const AnimatedView = Animated.createAnimatedComponent(View)

export interface UltraCardProps extends ViewProps {
  children: React.ReactNode
  index?: number
  enableReveal?: boolean
  enableHoverLift?: boolean
  enableGlow?: boolean
  enableTilt?: boolean
  glowColor?: string
  style?: ViewStyle
}

export function UltraCard({
  children,
  index = 0,
  enableReveal = true,
  enableHoverLift = true,
  enableGlow = false,
  enableTilt = false,
  glowColor = 'rgba(99, 102, 241, 0.4)',
  style,
  ...props
}: UltraCardProps): React.JSX.Element {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(30)
  const rotateY = useSharedValue(-12)
  const hoverLift = useHoverLift({ scale: 1.03, translateY: -6, hapticFeedback: true })
  const glowPulse = useGlowPulse({
    enabled: enableGlow,
    color: glowColor,
    intensity: 1.4,
  })
  const parallaxTilt = useParallaxTilt({
    enabled: enableTilt,
    maxTilt: 10,
  })

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
    transform: [{ translateY: translateY.value }, { rotateY: `${rotateY.value}deg` }],
  }))

  const combinedStyle = enableHoverLift ? [revealStyle, hoverLift.animatedStyle] : revealStyle

  const tiltStyle = enableTilt ? parallaxTilt.animatedStyle : undefined
  const glowStyle = enableGlow ? glowPulse.animatedStyle : undefined
  const cardDimensionsRef = useRef<{ width: number; height: number }>({ width: 200, height: 200 })

  const handleLayout = (event: {
    nativeEvent: { layout: { width: number; height: number } }
  }): void => {
    const { width, height } = event.nativeEvent.layout
    cardDimensionsRef.current = { width, height }
  }

  // Gesture for parallax tilt
  const tiltGesture = enableTilt
    ? Gesture.Pan()
        .onUpdate(event => {
          const { width, height } = cardDimensionsRef.current
          parallaxTilt.handleMove(event.x, event.y, width, height)
        })
        .onEnd(() => {
          parallaxTilt.handleLeave()
        })
    : undefined

  const cardContent = (
    <AnimatedView
      style={[styles.card, combinedStyle, tiltStyle, glowStyle, style]}
      onLayout={handleLayout}
      {...props}
    >
      {children}
    </AnimatedView>
  )

  // Wrap with gesture detector if tilt is enabled
  if (enableTilt && tiltGesture) {
    return (
      <GestureDetector gesture={tiltGesture}>
        <AnimatedView
          onTouchStart={enableHoverLift ? hoverLift.handlePressIn : undefined}
          onTouchEnd={enableHoverLift ? hoverLift.handlePressOut : undefined}
        >
          {cardContent}
        </AnimatedView>
      </GestureDetector>
    )
  }

  return (
    <AnimatedView
      onTouchStart={enableHoverLift ? hoverLift.handlePressIn : undefined}
      onTouchEnd={enableHoverLift ? hoverLift.handlePressOut : undefined}
    >
      {cardContent}
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'var(--color-bg-overlay)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: 'var(--color-fg)',
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
