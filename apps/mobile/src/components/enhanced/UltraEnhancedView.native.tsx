/**
 * UltraEnhancedView - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/UltraEnhancedView.native.tsx
 * 
 * Wraps any view with ultra animations and effects
 */

import React, { useEffect } from 'react'
import { View, type ViewStyle, type ViewProps } from 'react-native'
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, withSpring, Easing } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { springConfigs } from '@/effects/reanimated/transitions'
import { isTruthy, isDefined } from '@/core/guards';

const AnimatedView = Animated.createAnimatedComponent(View)

export interface UltraEnhancedViewProps extends ViewProps {
  children: React.ReactNode
  enableParallax?: boolean
  enableBreathing?: boolean
  enableTransition?: boolean
  style?: ViewStyle
}

export function UltraEnhancedView({
  children,
  enableParallax = false,
  enableBreathing = false,
  enableTransition = true,
  style,
  ...props
}: UltraEnhancedViewProps): React.JSX.Element {
  const reducedMotion = useReducedMotionSV()
  const translateY = useSharedValue(enableTransition ? 20 : 0)
  const opacity = useSharedValue(enableTransition ? 0 : 1)
  const scale = useSharedValue(enableBreathing ? 0.995 : 1)
  const parallaxOffset = useSharedValue(0)

  useEffect(() => {
    if (enableTransition && !reducedMotion.value) {
      opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
      translateY.value = withSpring(0, springConfigs.smooth)
    } else if (isTruthy(enableTransition)) {
      opacity.value = 1
      translateY.value = 0
    }
  }, [enableTransition, reducedMotion, opacity, translateY])

  useEffect(() => {
    if (enableBreathing && !reducedMotion.value) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.005, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.995, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    } else if (isTruthy(enableBreathing)) {
      scale.value = 1
    }
  }, [enableBreathing, reducedMotion, scale])

  const transitionStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: parallaxOffset.value }],
  }))

  const combinedStyle = [
    transitionStyle,
    enableBreathing && breathingStyle,
    enableParallax && parallaxStyle,
  ]

  return (
    <AnimatedView style={[combinedStyle, style]} {...props}>
      {children}
    </AnimatedView>
  )
}
