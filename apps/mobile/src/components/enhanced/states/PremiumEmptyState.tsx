import React, { useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { PremiumButton } from '../PremiumButton'

const AnimatedView = Animated.View

export interface PremiumEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onPress: () => void
  }
  variant?: 'default' | 'minimal' | 'illustrated'
  style?: ViewStyle
  testID?: string
}

export function PremiumEmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  style,
  testID = 'premium-empty-state',
}: PremiumEmptyStateProps): React.JSX.Element {
  const scale = useSharedValue(0.9)
  const opacity = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    const springConfig = reducedMotion.value ? { duration: 200 } : { stiffness: 400, damping: 30 }
    scale.value = withSpring(1, springConfig)
    opacity.value = withSpring(1, springConfig)
  }, [scale, opacity, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const handleAction = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    action?.onPress()
  }, [action])

  const variants = {
    default: { paddingVertical: 48, paddingHorizontal: 16 },
    minimal: { paddingVertical: 32, paddingHorizontal: 16 },
    illustrated: { paddingVertical: 64, paddingHorizontal: 16 },
  }

  return (
    <AnimatedView
      style={[styles.container, variants[variant], animatedStyle, style]}
      testID={testID}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {action && (
        <View style={styles.actionContainer}>
          <PremiumButton onPress={handleAction} variant="primary" size="md">
            {action.label}
          </PremiumButton>
        </View>
      )}
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  actionContainer: {
    marginTop: 8,
  },
})
