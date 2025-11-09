import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'

const AnimatedView = Animated.View

export type PremiumToastType = 'success' | 'error' | 'warning' | 'info'

export interface PremiumToastAction {
  label: string
  onPress: () => void
}

export interface PremiumToastProps {
  id: string
  type: PremiumToastType
  title: string
  description?: string
  action?: PremiumToastAction
  duration?: number
  onDismiss: (id: string) => void
  position?: 'top' | 'bottom'
  showProgress?: boolean
  style?: ViewStyle
  testID?: string
}

const SPRING_CONFIG = { stiffness: 400, damping: 30 }

const colors: Record<PremiumToastType, { bg: string; border: string; text: string; icon: string }> =
  {
    success: { bg: '#dcfce7', border: '#86efac', text: '#166534', icon: '#22c55e' },
    error: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', icon: '#ef4444' },
    warning: { bg: '#fef3c7', border: '#fde047', text: '#854d0e', icon: '#eab308' },
    info: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', icon: '#3b82f6' },
  }

export function PremiumToast({
  id,
  type,
  title,
  description,
  action,
  duration = 5000,
  onDismiss,
  position = 'top',
  showProgress = true,
  style,
  testID = 'premium-toast',
}: PremiumToastProps): React.JSX.Element {
  const [isPaused] = useState(false)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(position === 'top' ? -20 : 20)
  const scale = useSharedValue(0.95)
  const progressWidth = useSharedValue(100)
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    if (reducedMotion.value) {
      opacity.value = withTiming(1, { duration: 200 })
      translateY.value = withTiming(0, { duration: 200 })
      scale.value = withTiming(1, { duration: 200 })
    } else {
      opacity.value = withSpring(1, SPRING_CONFIG)
      translateY.value = withSpring(0, SPRING_CONFIG)
      scale.value = withSpring(1, SPRING_CONFIG)
    }
  }, [opacity, translateY, scale, reducedMotion])

  const handleDismiss = useCallback((): void => {
    opacity.value = withTiming(0, { duration: 200 })
    scale.value = withTiming(0.9, { duration: 200 })
    setTimeout(() => onDismiss(id), 200)
  }, [id, onDismiss, opacity, scale])

  useEffect(() => {
    if (!showProgress || isPaused || duration === 0) return

    if (reducedMotion.value) {
      progressWidth.value = withTiming(0, { duration })
    } else {
      progressWidth.value = withTiming(0, { duration })
    }

    const timer = setTimeout(() => {
      handleDismiss()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, handleDismiss, isPaused, showProgress, progressWidth, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }))

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }))

  const colorScheme = colors[type]

  return (
    <AnimatedView
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
      {showProgress && (
        <AnimatedView
          style={[
            styles.progressBar,
            {
              backgroundColor: colorScheme.icon,
              opacity: 0.3,
            },
            progressStyle,
          ]}
        />
      )}

      <View style={[styles.icon, { backgroundColor: colorScheme.icon }]} />

      <View style={styles.content}>
        <Text style={[styles.title, { color: colorScheme.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.description, { color: colorScheme.text }]}>{description}</Text>
        )}
        {action && (
          <TouchableOpacity
            onPress={() => {
              action.onPress()
              handleDismiss()
            }}
            style={styles.actionButton}
          >
            <Text style={[styles.actionText, { color: colorScheme.text }]}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={handleDismiss}
        style={styles.dismissButton}
        accessibilityLabel="Dismiss notification"
      >
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>
    </AnimatedView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
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
    color: '#000',
  },
})
