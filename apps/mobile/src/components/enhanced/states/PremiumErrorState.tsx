import React, { useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, type ViewStyle } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { PremiumButton } from '../PremiumButton'
import FeatherIcon from 'react-native-vector-icons/Feather'
import type { IconProps } from 'react-native-vector-icons/Icon'

const AlertCircle = (props: Omit<IconProps, 'name'>): React.JSX.Element => (
  <FeatherIcon name="alert-circle" {...props} />
)
const ArrowClockwise = (props: Omit<IconProps, 'name'>): React.JSX.Element => (
  <FeatherIcon name="rotate-ccw" {...props} />
)

const AnimatedView = Animated.View

export interface PremiumErrorStateProps {
  title?: string
  message?: string
  error?: Error | string
  onRetry?: () => void
  retryLabel?: string
  variant?: 'default' | 'minimal' | 'detailed'
  showDetails?: boolean
  style?: ViewStyle
  testID?: string
}

export function PremiumErrorState({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'default',
  showDetails = false,
  style,
  testID = 'premium-error-state',
}: PremiumErrorStateProps): React.JSX.Element {
  const scale = useSharedValue(0.9)
  const opacity = useSharedValue(0)
  const shake = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    const springConfig = reducedMotion.value ? { duration: 200 } : { stiffness: 400, damping: 30 }
    scale.value = withSpring(1, springConfig)
    opacity.value = withSpring(1, springConfig)
  }, [scale, opacity, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shake.value }],
    opacity: opacity.value,
  }))

  const handleRetry = useCallback((): void => {
    if (!reducedMotion.value) {
      shake.value = withSpring(10, { stiffness: 400, damping: 20 })
      setTimeout(() => {
        shake.value = withSpring(-10, { stiffness: 400, damping: 20 })
        setTimeout(() => {
          shake.value = withSpring(0, { stiffness: 400, damping: 30 })
        }, 100)
      }, 100)
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onRetry?.()
  }, [onRetry, shake, reducedMotion])

  const errorMessage = typeof error === 'string' ? error : error?.message || message
  const errorDetails = typeof error === 'object' && error?.stack ? error.stack : undefined

  const variants = {
    default: { paddingVertical: 48, paddingHorizontal: 16 },
    minimal: { paddingVertical: 32, paddingHorizontal: 16 },
    detailed: { paddingVertical: 48, paddingHorizontal: 16 },
  }

  return (
    <AnimatedView
      style={[styles.container, variants[variant], animatedStyle, style]}
      testID={testID}
    >
      <View style={styles.iconContainer}>
        <AlertCircle size={48} color="var(--color-error-9)" />
      </View>
      <Text style={styles.title}>{title}</Text>
      {errorMessage && <Text style={styles.message}>{errorMessage}</Text>}
      {showDetails && errorDetails && variant === 'detailed' && (
        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Error Details</Text>
          <Text style={styles.details}>{errorDetails}</Text>
        </ScrollView>
      )}
      {onRetry && (
        <View style={styles.actionContainer}>
          <PremiumButton
            onPress={handleRetry}
            variant="primary"
            size="md"
            icon={<ArrowClockwise size={16} color="var(--color-bg-overlay)" />}
          >
            {retryLabel}
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
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  detailsContainer: {
    maxHeight: 200,
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  details: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  actionContainer: {
    marginTop: 8,
  },
})
