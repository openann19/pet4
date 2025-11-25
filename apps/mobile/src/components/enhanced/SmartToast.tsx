import React, { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withSpring, withTiming } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface SmartToastProps {
  id: string
  type: ToastType
  title: string
  description?: string
  action?: ToastAction
  duration?: number
  onDismiss: (id: string) => void
  position?: 'top' | 'bottom'
  style?: ViewStyle
  testID?: string
}

const colors: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: '#dcfce7', border: '#86efac', text: '#166534', icon: 'var(--color-success-9)' },
  error: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', icon: 'var(--color-error-9)' },
  warning: { bg: '#fef3c7', border: '#fde047', text: '#854d0e', icon: 'var(--color-warning-9)' },
  info: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', icon: 'var(--color-accent-secondary-9)' },
}

export function SmartToast({
  id,
  type,
  title,
  description,
  action,
  duration: _duration = 5000,
  onDismiss,
  position = 'top',
  style,
  testID = 'smart-toast',
}: SmartToastProps): React.JSX.Element {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(position === 'top' ? -20 : 20)
  const scale = useSharedValue(0.95)
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    if (isTruthy(reducedMotion.value)) {
      opacity.value = withTiming(1, { duration: 200 })
      translateY.value = withTiming(0, { duration: 200 })
      scale.value = withTiming(1, { duration: 200 })
    } else {
      opacity.value = withSpring(1, { stiffness: 400, damping: 30 })
      translateY.value = withSpring(0, { stiffness: 400, damping: 30 })
      scale.value = withSpring(1, { stiffness: 400, damping: 30 })
    }
  }, [opacity, translateY, scale, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }))

  const colorScheme = colors[type]

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colorScheme.bg,
          borderColor: colorScheme.border,
        },
        animatedStyle,
        style,
      ]}
      testID={testID}
    >
      <View style={[styles.icon, { backgroundColor: colorScheme.icon }]} />

      <View style={styles.content}>
        <Text style={[styles.title, { color: colorScheme.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.description, { color: colorScheme.text }]}>{description}</Text>
        )}
        {action && (
          <TouchableOpacity
            onPress={() => {
              action.onClick()
              onDismiss(id)
            }}
            style={styles.actionButton}
          >
            <Text style={[styles.actionText, { color: colorScheme.text }]}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onDismiss(id)
        }}
        style={styles.dismissButton}
        accessibilityLabel="Dismiss notification"
      >
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 320,
    maxWidth: 400,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 2,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    opacity: 0.9,
    lineHeight: 16,
  },
  actionButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dismissButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  dismissText: {
    fontSize: 20,
    fontWeight: '300',
    color: 'var(--color-fg)',
  },
})
