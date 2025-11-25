import { colors } from '@mobile/theme/colors'
import * as Haptics from 'expo-haptics'
import React, { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Animated, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from '@petspark/motion'
import type { Notification } from './types'

interface NotificationToastProps {
  notification: Notification
  onDismiss: () => void
}

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
}

export function NotificationToast({
  notification,
  onDismiss,
}: NotificationToastProps): React.ReactElement {
  const translateY = useSharedValue(-100)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)

  useEffect(() => {
    // Haptic feedback based on type
    const hapticType =
      notification.type === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : notification.type === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning

    void Haptics.notificationAsync(hapticType)

    // Entrance animation
    translateY.value = withSpring(0, SPRING_CONFIG)
    opacity.value = withTiming(1, { duration: 300 })
    scale.value = withSpring(1, SPRING_CONFIG)

    return () => {
      // Exit animation
      translateY.value = withTiming(-100, { duration: 250 })
      opacity.value = withTiming(0, { duration: 250 })
      scale.value = withTiming(0.8, { duration: 250 })
    }
  }, [notification, translateY, opacity, scale])

  const handleDismiss = (): void => {
    translateY.value = withTiming(-100, { duration: 250 }, () => {
      runOnJS(onDismiss)()
    })
    opacity.value = withTiming(0, { duration: 250 })
    scale.value = withTiming(0.8, { duration: 250 })
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      opacity: opacity.value,
    }
  })

  const backgroundColor =
    notification.type === 'success'
      ? colors.success
      : notification.type === 'error'
        ? colors.danger
        : notification.type === 'warning'
          ? colors.warning
          : colors.primary

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        style={[styles.toast, { backgroundColor }]}
        onPress={handleDismiss}
        accessibilityRole="alert"
        accessibilityLabel={`${String(notification.type ?? '')}: ${String(notification.title ?? '')}`}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{notification.title}</Text>
          {notification.message ? <Text style={styles.message}>{notification.message}</Text> : null}
        </View>
        {notification.action ? (
          <Pressable
            style={styles.action}
            onPress={() => {
              notification.action?.onPress()
              handleDismiss()
            }}
          >
            <Text style={styles.actionText}>{notification.action.label}</Text>
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 12,
    padding: 16,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    color: 'var(--color-bg-overlay)',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    color: 'var(--color-bg-overlay)',
    fontSize: 14,
    opacity: 0.9,
  },
  action: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 14,
    fontWeight: '600',
  },
})
