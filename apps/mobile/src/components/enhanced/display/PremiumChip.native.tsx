import React, { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import FeatherIcon from 'react-native-vector-icons/Feather'
const X = (props: any) => <FeatherIcon name="x" {...props} />

const AnimatedView = Animated.View

export interface PremiumChipProps {
  label: string
  variant?: 'default' | 'outlined' | 'filled' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  onClose?: () => void
  selected?: boolean
  disabled?: boolean
  style?: ViewStyle
  testID?: string
  accessibilityLabel: string
}

export function PremiumChip({
  label,
  variant = 'default',
  size = 'md',
  icon,
  onClose,
  selected = false,
  disabled = false,
  style,
  testID = 'premium-chip',
  accessibilityLabel,
}: PremiumChipProps): React.JSX.Element {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const reducedMotion = useReducedMotionSV()

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const handleClose = useCallback(() => {
    if (disabled || !onClose) return

    const timingConfig = reducedMotion.value ? { duration: 200 } : { duration: 150 }
    scale.value = withSpring(0.8, { stiffness: 400, damping: 30 })
    opacity.value = withTiming(0, timingConfig)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    setTimeout(() => {
      onClose()
    }, 200)
  }, [disabled, onClose, scale, opacity, reducedMotion])

  const handlePress = useCallback(() => {
    if (disabled) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [disabled])

  const sizes = {
    sm: { paddingVertical: 4, paddingHorizontal: 8, fontSize: 12, height: 24 },
    md: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14, height: 32 },
    lg: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 16, height: 40 },
  }

  const variants = {
    default: selected
      ? { backgroundColor: '#6366f1', borderColor: '#6366f1', textColor: '#ffffff' }
      : { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', textColor: '#374151' },
    outlined: selected
      ? { backgroundColor: 'transparent', borderColor: '#6366f1', textColor: '#6366f1' }
      : { backgroundColor: 'transparent', borderColor: '#d1d5db', textColor: '#374151' },
    filled: selected
      ? { backgroundColor: '#6366f1', borderColor: 'transparent', textColor: '#ffffff' }
      : { backgroundColor: '#f3f4f6', borderColor: 'transparent', textColor: '#374151' },
    gradient: selected
      ? { backgroundColor: '#6366f1', borderColor: 'transparent', textColor: '#ffffff' }
      : { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', textColor: '#374151' },
  }

  const variantStyle = variants[variant]
  const sizeStyle = sizes[size]

  return (
    <AnimatedView style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.container,
          {
            backgroundColor: variantStyle.backgroundColor,
            borderColor: variantStyle.borderColor,
            borderWidth: variant === 'outlined' ? 2 : 1,
            borderRadius: 9999,
            paddingVertical: sizeStyle.paddingVertical,
            paddingHorizontal: sizeStyle.paddingHorizontal,
            height: sizeStyle.height,
            opacity: disabled ? 0.5 : 1,
            shadowColor: selected ? '#6366f1' : '#000',
            shadowOffset: { width: 0, height: selected ? 2 : 1 },
            shadowOpacity: selected ? 0.2 : 0.05,
            shadowRadius: selected ? 4 : 2,
            elevation: selected ? 3 : 1,
          },
        ]}
        testID={testID}
        accessibilityRole={onClose ? 'button' : undefined}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected, disabled }}
      >
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              styles.label,
              {
                fontSize: sizeStyle.fontSize,
                color: variantStyle.textColor,
              },
            ]}
          >
            {label}
          </Text>
          {onClose && (
            <TouchableOpacity
              onPress={handleClose}
              disabled={disabled}
              style={styles.closeButton}
              accessibilityLabel="Remove chip"
            >
              <X size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} color={variantStyle.textColor} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 4,
    padding: 2,
  },
})
