/**
 * Spinner Component (Mobile)
 * Premium loading spinner with smooth animations and reduced motion support
 * Location: apps/mobile/src/components/ui/Spinner.tsx
 */

import React, { useEffect } from 'react'
import type { ViewStyle, StyleProp } from 'react-native'
import { StyleSheet, View, AccessibilityInfo } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'subtle' | 'premium'
  style?: StyleProp<ViewStyle>
  testID?: string
}

const sizeValues = {
  sm: 16,
  md: 32,
  lg: 48,
} as const

const borderWidthValues = {
  sm: 2,
  md: 2,
  lg: 4,
} as const

export function Spinner({
  size = 'md',
  variant = 'default',
  style,
  testID = 'spinner',
}: SpinnerProps): React.JSX.Element {
  const [reducedMotion, setReducedMotion] = React.useState(false)

  React.useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      setReducedMotion(enabled)
    })
  }, [])

  const rotation = useSharedValue(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (reducedMotion) {
      // For reduced motion, use a slower, less noticeable animation
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 2000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
      opacity.value = withRepeat(
        withTiming(0.7, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    } else {
      // Premium smooth animation for normal users
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
      opacity.value = 1
    }
  }, [reducedMotion, rotation, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
      opacity: opacity.value,
    }
  })

  const sizeValue = sizeValues[size]
  const borderWidth = borderWidthValues[size]

  const variantStyles = {
    default: {
      borderColor: '#3b82f6', // primary color
      borderTopColor: 'transparent',
    },
    subtle: {
      borderColor: 'rgba(59, 130, 246, 0.6)', // primary/60
      borderTopColor: 'rgba(59, 130, 246, 0.4)', // primary/40
    },
    premium: {
      borderColor: '#3b82f6',
      borderTopColor: 'transparent',
      shadowColor: '#3b82f6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
  } as const

  const containerStyle = [
    styles.container,
    {
      width: sizeValue,
      height: sizeValue,
      borderWidth,
      ...variantStyles[variant],
    },
    style,
  ]

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite"
      testID={testID}
      style={styles.wrapper}
    >
      <Animated.View style={[containerStyle, animatedStyle]} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    borderRadius: 9999,
    borderStyle: 'solid',
  },
})
