import React, { useCallback, useRef, useEffect, useMemo } from 'react'
import { Pressable, Text, StyleSheet, View, type ViewStyle } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withSpring, withTiming, measure, runOnUI, useAnimatedRef } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
const AnimatedView = Animated.View

export interface SegmentedControlOption {
  label: string
  value: string
  icon?: React.ReactNode
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  multiSelect?: boolean
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
  testID?: string
  accessibilityLabel: string
}

const SPRING_CONFIG = { stiffness: 400, damping: 20 } as const
const MAX_SEGMENTS = 10 // Maximum expected segments

export function SegmentedControl({
  options,
  value,
  onValueChange,
  multiSelect = false,
  size = 'md',
  style,
  testID = 'segmented-control',
  accessibilityLabel,
}: SegmentedControlProps): React.JSX.Element {
  const containerRef = useRef<View>(null)
  // Create refs for maximum expected segments at top level (hooks rules compliance)
  // Only use the refs we need based on options.length
  const ref0 = useAnimatedRef<React.ComponentRef<typeof AnimatedPressable>>()
  const ref1 = useAnimatedRef<React.ComponentRef<typeof AnimatedPressable>>()
  const ref2 = useAnimatedRef<React.ComponentRef<typeof AnimatedPressable>>()
  const ref3 = useAnimatedRef<React.ComponentRef<typeof AnimatedPressable>>()
  const ref4 = useAnimatedRef<React.ComponentRef<typeof AnimatedPressable>>()
  const ref5 = useAnimatedRef<React.ComponentRef<typeof AnimatedPressable>>()
  const ref6 = useAnimatedRef<React.ComponentRef<typeof AnimatedPressable>>()
  const ref7 = useAnimatedRef<React.ComponentRef<typeof AnimatedPressable>>()
  const ref8 = useAnimatedRef<React.ComponentRef<typeof AnimatedPressable>>()
  const ref9 = useAnimatedRef<React.ComponentRef<typeof AnimatedPressable>>()

  const allRefs = [ref0, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9]
  const buttonRefs = allRefs.slice(0, Math.min(options.length, MAX_SEGMENTS))
  const indicatorPosition = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()
  const selectedValues = useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value]
  )

  const updateIndicator = useCallback(() => {
    const selectedIndex = options.findIndex(opt => selectedValues.includes(opt.value))
    if (selectedIndex >= 0 && buttonRefs[selectedIndex]) {
      const button = buttonRefs[selectedIndex]
      if (button) {
        runOnUI(() => {
          'worklet'
          const measurements = measure(button)
          if (isTruthy(measurements)) {
            indicatorPosition.value = reducedMotion.value
              ? withTiming(measurements.pageX, { duration: 200 })
              : withSpring(measurements.pageX, SPRING_CONFIG)
            indicatorWidth.value = reducedMotion.value
              ? withTiming(measurements.width, { duration: 200 })
              : withSpring(measurements.width, SPRING_CONFIG)
          }
        })()
      }
    }
  }, [options, selectedValues, indicatorPosition, indicatorWidth, reducedMotion, buttonRefs])

  useEffect(() => {
    updateIndicator()
  }, [updateIndicator, selectedValues])

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: indicatorWidth.value,
  }))

  const indicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (indicatorTimeoutRef.current !== null) {
        clearTimeout(indicatorTimeoutRef.current)
      }
    }
  }, [])

  const handleOptionPress = useCallback(
    (optionValue: string) => {
      if (isTruthy(multiSelect)) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue]
        onValueChange?.(newValues)
      } else {
        onValueChange?.(optionValue)
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      if (indicatorTimeoutRef.current !== null) {
        clearTimeout(indicatorTimeoutRef.current)
      }
      indicatorTimeoutRef.current = setTimeout(() => {
        updateIndicator()
        indicatorTimeoutRef.current = null
      }, 100)
    },
    [multiSelect, selectedValues, onValueChange, updateIndicator]
  )

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingHorizontal: 8, paddingVertical: 4, minHeight: 36 },
    md: { paddingHorizontal: 12, paddingVertical: 6, minHeight: 44 },
    lg: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 52 },
  }

  const textSizeStyles: Record<string, { fontSize: number }> = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  }

  return (
    <View
      ref={containerRef}
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      <AnimatedView style={[styles.indicator, indicatorStyle]} />
      {options.map((option, index) => {
        const isSelected = selectedValues.includes(option.value)
        return (
          <AnimatedPressable
            key={option.value}
            ref={buttonRefs[index]}
            onPress={() => handleOptionPress(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            style={[styles.button, sizeStyles[size], isSelected && styles.buttonSelected]}
          >
            {option.icon && <View style={styles.iconContainer}>{option.icon}</View>}
            <Text
              style={[
                styles.text,
                textSizeStyles[size],
                isSelected ? styles.textSelected : styles.textUnselected,
              ]}
            >
              {option.label}
            </Text>
          </AnimatedPressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: 'var(--color-bg-overlay)',
    borderRadius: 8,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 8,
  },
  buttonSelected: {
    // Selected state handled by indicator
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontWeight: '500',
  },
  textSelected: {
    color: 'var(--color-fg)',
  },
  textUnselected: {
    color: '#64748b',
  },
})
