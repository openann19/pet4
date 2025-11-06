import React, { useEffect } from 'react'
import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'

export interface PremiumProgressProps {
  value?: number
  max?: number
  variant?: 'default' | 'gradient' | 'striped'
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  label?: string
  animated?: boolean
  style?: ViewStyle
  testID?: string
  'aria-label': string
}

export function PremiumProgress({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = false,
  label,
  animated = true,
  style,
  testID = 'premium-progress',
  'aria-label': ariaLabel,
}: PremiumProgressProps): React.JSX.Element {
  const reducedMotion = useReducedMotionSV()
  const progressWidth = useSharedValue(0)
  const shimmerX = useSharedValue(-100)

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  useEffect(() => {
    const springConfig = reducedMotion.value
      ? { duration: 200 }
      : { stiffness: 400, damping: 30 }
    const timingConfig = { duration: 300 }

    if (animated) {
      progressWidth.value = withSpring(percentage, springConfig)
    } else {
      progressWidth.value = withTiming(percentage, timingConfig)
    }
  }, [percentage, animated, reducedMotion, progressWidth])

  useEffect(() => {
    if (variant === 'striped') {
      shimmerX.value = withRepeat(
        withTiming(200, { duration: 2000 }),
        -1,
        false
      )
    }
  }, [variant, shimmerX])

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }))

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }))

  const sizes = {
    sm: { height: 4 },
    md: { height: 8 },
    lg: { height: 12 },
  }

  const variants = {
    default: '#6366f1',
    gradient: '#6366f1', // Gradient handled via LinearGradient if needed
    striped: '#6366f1',
  }

  return (
    <View style={[styles.container, style]} testID={testID} accessibilityLabel={ariaLabel}>
      {(label || showValue) && (
        <View style={styles.header}>
          {label && (
            <Text style={styles.label}>{label}</Text>
          )}
          {showValue && (
            <Text style={styles.value}>{Math.round(percentage)}%</Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.track,
          sizes[size],
        ]}
      >
        <Animated.View
          style={[
            styles.progress,
            progressStyle,
            {
              height: sizes[size].height,
              backgroundColor: variants[variant],
            },
            variant === 'striped' && styles.striped
          ]}
        >
          {variant === 'striped' && (
            <Animated.View
              style={[
                styles.shimmer,
                shimmerStyle,
                { height: sizes[size].height }
              ]}
            />
          )}
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  value: {
    fontSize: 14,
    color: '#6b7280',
  },
  track: {
    width: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 9999,
  },
  striped: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    width: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
})
