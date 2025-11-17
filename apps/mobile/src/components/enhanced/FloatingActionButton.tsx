/**
 * FloatingActionButton Component (Mobile)
 * Premium FAB with smooth animations and haptic feedback
 * Location: apps/mobile/src/components/enhanced/FloatingActionButton.tsx
 */

import React, { useEffect, useCallback } from 'react'
import type { ViewStyle, StyleProp } from 'react-native'
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { AccessibilityInfo } from 'react-native'
import * as Haptics from 'expo-haptics'
import { isTruthy } from '@petspark/shared';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export interface FloatingActionButtonProps {
  icon?: React.ReactNode
  onClick?: () => void
  style?: StyleProp<ViewStyle>
  expanded?: boolean
  label?: string
  testID?: string
}

const SPRING_CONFIG = {
  stiffness: 400,
  damping: 20,
  mass: 1,
} as const

export function FloatingActionButton({
  icon,
  onClick,
  style,
  expanded = false,
  label,
  testID = 'floating-action-button',
}: FloatingActionButtonProps): React.JSX.Element {
  const [reducedMotion, setReducedMotion] = React.useState(false)

  React.useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      setReducedMotion(enabled)
    })
  }, [])

  const scale = useSharedValue(0)
  const rotate = useSharedValue(-180)
  const iconRotate = useSharedValue(0)
  const labelOpacity = useSharedValue(0)
  const labelWidth = useSharedValue(0)
  const shimmerX = useSharedValue(-100)
  const pressScale = useSharedValue(1)

  // Entry animation
  useEffect(() => {
    if (isTruthy(reducedMotion)) {
      scale.value = withTiming(1, { duration: 200 })
      rotate.value = withTiming(0, { duration: 200 })
    } else {
      scale.value = withSpring(1, SPRING_CONFIG)
      rotate.value = withSpring(0, SPRING_CONFIG)
    }
     
  }, [scale, rotate, reducedMotion])

  // Expanded state
  useEffect(() => {
    if (isTruthy(expanded)) {
      iconRotate.value = withSpring(45, SPRING_CONFIG)
      labelOpacity.value = withTiming(1, { duration: 200 })
      labelWidth.value = withTiming(1, { duration: 200 })
    } else {
      iconRotate.value = withSpring(0, SPRING_CONFIG)
      labelOpacity.value = withTiming(0, { duration: 200 })
      labelWidth.value = withTiming(0, { duration: 200 })
    }
  }, [expanded, iconRotate, labelOpacity, labelWidth])

  // Shimmer effect
  useEffect(() => {
    if (isTruthy(reducedMotion)) return

    shimmerX.value = withRepeat(
      withSequence(
        withDelay(3000, withTiming(100, { duration: 2000, easing: Easing.linear })),
        withTiming(-100, { duration: 0 })
      ),
      -1,
      false
    )
  }, [shimmerX, reducedMotion])

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value * pressScale.value }, { rotate: `${rotate.value}deg` }],
      width: expanded ? undefined : 56,
      paddingLeft: expanded ? 20 : 0,
      paddingRight: expanded ? 20 : 0,
    }
  })

  const iconContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${String(iconRotate.value ?? '')}deg` }],
      width: 56,
      height: 56,
    }
  })

  const labelStyle = useAnimatedStyle(() => {
    return {
      opacity: labelOpacity.value,
      width: labelWidth.value === 0 ? 0 : undefined,
    }
  })

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${shimmerX.value}%` as `${number}%` }],
    }
  })

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    onClick?.()
  }, [onClick])

  const handlePressIn = useCallback(() => {
    if (isTruthy(reducedMotion)) return
    pressScale.value = withSpring(0.95, SPRING_CONFIG)
  }, [pressScale, reducedMotion])

  const handlePressOut = useCallback(() => {
    if (isTruthy(reducedMotion)) return
    pressScale.value = withSpring(1, SPRING_CONFIG)
  }, [pressScale, reducedMotion])

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, buttonStyle, style]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Floating action button'}
      testID={testID}
    >
      <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
        {icon ?? <Text style={styles.iconText}>+</Text>}
      </Animated.View>

      {expanded && label && (
        <Animated.View style={[styles.labelContainer, labelStyle]}>
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
      )}

      {!reducedMotion && (
        <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none" />
      )}
    </AnimatedTouchable>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'var(--color-accent-secondary-9)', // primary color
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'var(--color-bg-overlay)',
  },
  labelContainer: {
    paddingRight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'var(--color-bg-overlay)',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '50%',
  },
})
