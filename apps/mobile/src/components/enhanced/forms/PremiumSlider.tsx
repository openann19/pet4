import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withSpring, withTiming } from '@petspark/motion'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

const AnimatedView = Animated.View
const AnimatedText = Animated.createAnimatedComponent(Text)

export interface PremiumSliderProps {
  value?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  showSteps?: boolean
  disabled?: boolean
  label?: string
  style?: ViewStyle
  testID?: string
  accessibilityLabel: string
}

const SPRING_CONFIG = { stiffness: 400, damping: 20 }

export function PremiumSlider({
  value = 0,
  min = 0,
  max = 100,
  size: _size = 'md',
  showValue = false,
  showSteps = false,
  disabled = false,
  label,
  style,
  testID = 'premium-slider',
  accessibilityLabel,
}: PremiumSliderProps): React.JSX.Element {
  const [isDragging, setIsDragging] = useState(false)
  const tooltipOpacity = useSharedValue(0)
  const tooltipScale = useSharedValue(0.8)
  const reducedMotion = useReducedMotionSV()

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ scale: tooltipScale.value }],
  }))

  const handleSlidingStart = useCallback((): void => {
    setIsDragging(true)
    if (isTruthy(reducedMotion.value)) {
      tooltipOpacity.value = withTiming(1, { duration: 200 })
      tooltipScale.value = withTiming(1, { duration: 200 })
    } else {
      tooltipOpacity.value = withSpring(1, SPRING_CONFIG)
      tooltipScale.value = withSpring(1, SPRING_CONFIG)
    }
  }, [tooltipOpacity, tooltipScale, reducedMotion])

  const handleSlidingComplete = useCallback((): void => {
    setIsDragging(false)
    tooltipOpacity.value = withTiming(0, { duration: 200 })
    tooltipScale.value = withTiming(0.8, { duration: 200 })
  }, [tooltipOpacity, tooltipScale])

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{
        min,
        max,
        now: value,
      }}
    >
      {(label || showValue) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showValue && <Text style={styles.value}>{Math.round(value)}</Text>}
        </View>
      )}

      <View style={styles.sliderContainer}>
        {showSteps && (
          <View style={styles.steps}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={styles.step} />
            ))}
          </View>
        )}

        <View style={styles.sliderWrapper}>
          <View
            style={[styles.track, { opacity: disabled ? 0.5 : 1 }]}
            onStartShouldSetResponder={() => !disabled}
            onMoveShouldSetResponder={() => !disabled}
            onResponderGrant={handleSlidingStart}
            onResponderRelease={handleSlidingComplete}
          >
            <View
              style={[
                styles.trackFill,
                {
                  width: `${((value - min) / (max - min)) * 100}%`,
                },
              ]}
            />
          </View>

          {isDragging && (
            <AnimatedView
              style={[
                styles.tooltip,
                {
                  left: `${((value - min) / (max - min)) * 100}%` as const,
                },
                tooltipStyle,
              ]}
              pointerEvents="none"
            >
              <AnimatedText style={styles.tooltipText}>{Math.round(value)}</AnimatedText>
            </AnimatedView>
          )}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'var(--color-fg)',
  },
  value: {
    fontSize: 14,
    color: '#64748b',
  },
  sliderContainer: {
    position: 'relative',
  },
  steps: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 8,
    zIndex: 1,
  },
  step: {
    width: 2,
    height: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    borderRadius: 1,
  },
  track: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: 'var(--color-accent-secondary-9)',
    borderRadius: 4,
  },
  sliderWrapper: {
    position: 'relative',
  },
  slider: {
    width: '100%',
  },
  tooltip: {
    position: 'absolute',
    bottom: 24,
    transform: [{ translateX: -20 }],
    backgroundColor: 'var(--color-fg)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tooltipText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 12,
    fontWeight: '600',
  },
})
