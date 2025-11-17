import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'

export interface PremiumToggleProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'accent'
  style?: ViewStyle
  testID?: string
}

export function PremiumToggle({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  variant = 'default',
  style,
  testID = 'premium-toggle',
}: PremiumToggleProps): React.JSX.Element {
  const reducedMotion = useReducedMotionSV()
  const togglePosition = useSharedValue(checked ? 1 : 0)
  const scale = useSharedValue(1)

  React.useEffect(() => {
    const springConfig = reducedMotion.value ? { duration: 200 } : { stiffness: 400, damping: 30 }
    togglePosition.value = withSpring(checked ? 1 : 0, springConfig)
  }, [checked, togglePosition, reducedMotion])

  const handleToggle = useCallback((): void => {
    if (disabled) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange?.(!checked)
  }, [disabled, checked, onChange])

  const toggleStyle = useAnimatedStyle(() => {
    const sizeMap = {
      sm: { width: 36, height: 20, thumb: 16, translate: 16 },
      md: { width: 44, height: 24, thumb: 20, translate: 20 },
      lg: { width: 52, height: 28, thumb: 24, translate: 24 },
    }

    const config = sizeMap[size]
    const translateX = togglePosition.value * (config.translate - config.thumb - 4)

    return {
      transform: [{ translateX }, { scale: scale.value }],
    }
  })

  const trackStyle = useAnimatedStyle(() => {
    const sizeMap = {
      sm: { width: 36, height: 20 },
      md: { width: 44, height: 24 },
      lg: { width: 52, height: 28 },
    }

    return {
      width: sizeMap[size].width,
      height: sizeMap[size].height,
    }
  })

  const variants = {
    default: checked ? '#6366f1' : '#e5e7eb',
    primary: checked ? '#6366f1' : '#e5e7eb',
    accent: checked ? '#8b5cf6' : '#e5e7eb',
  }

  const thumbSizes = {
    sm: { width: 16, height: 16 },
    md: { width: 20, height: 20 },
    lg: { width: 24, height: 24 },
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TouchableOpacity
        onPress={handleToggle}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityState={{ checked }}
        accessibilityLabel={label || 'Toggle'}
      >
        <Animated.View
          style={[
            trackStyle,
            {
              backgroundColor: variants[variant],
              borderRadius: 12,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <Animated.View
            style={[
              toggleStyle,
              {
                position: 'absolute',
                top: 2,
                left: 2,
                backgroundColor: 'var(--color-bg-overlay)',
                borderRadius: 10,
                ...thumbSizes[size],
                shadowColor: 'var(--color-fg)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 3,
              },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>

      {(label || description) && (
        <View style={styles.labelContainer}>
          {label && <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>}
          {description && (
            <Text style={[styles.description, disabled && styles.descriptionDisabled]}>
              {description}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  labelContainer: {
    flex: 1,
    paddingTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  labelDisabled: {
    opacity: 0.5,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  descriptionDisabled: {
    opacity: 0.5,
  },
})
