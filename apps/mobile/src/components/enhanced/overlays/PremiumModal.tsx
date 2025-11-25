import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import * as Haptics from 'expo-haptics'
import React, { useCallback, useEffect } from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { Animated, useAnimatedStyle, useSharedValue, withSpring, withTiming } from '@petspark/motion'
import FeatherIcon from 'react-native-vector-icons/Feather'
import { isTruthy } from '@petspark/shared';

import type { IconProps } from 'react-native-vector-icons/Icon'

const X = (props: Omit<IconProps, 'name'>): React.JSX.Element => <FeatherIcon name="x" {...props} />

const AnimatedView = Animated.View

export interface PremiumModalProps {
  visible?: boolean
  onClose?: () => void
  title?: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'glass' | 'centered'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdropPress?: boolean
  style?: ViewStyle
  testID?: string
}

export function PremiumModal({
  visible = false,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'default',
  size = 'md',
  showCloseButton = true,
  closeOnBackdropPress = true,
  style,
  testID = 'premium-modal',
}: PremiumModalProps): React.JSX.Element {
  const scale = useSharedValue(0.95)
  const opacity = useSharedValue(0)
  const backdropOpacity = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    const springConfig = reducedMotion.value ? { duration: 200 } : { stiffness: 400, damping: 30 }
    const timingConfig = { duration: 200 }

    if (isTruthy(visible)) {
      scale.value = withSpring(1, springConfig)
      opacity.value = withTiming(1, timingConfig)
      backdropOpacity.value = withTiming(1, timingConfig)
    } else {
      scale.value = withSpring(0.95, springConfig)
      opacity.value = withTiming(0, timingConfig)
      backdropOpacity.value = withTiming(0, timingConfig)
    }
  }, [visible, scale, opacity, backdropOpacity, reducedMotion])

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const handleClose = useCallback((): void => {
    if (closeOnBackdropPress) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onClose?.()
    }
  }, [closeOnBackdropPress, onClose])

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { maxWidth: 400 },
    md: { maxWidth: 500 },
    lg: { maxWidth: 600 },
    xl: { maxWidth: 800 },
    full: { maxWidth: '100%' },
  }

  const variants = {
    default: { backgroundColor: 'var(--color-bg-overlay)' },
    glass: { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
    centered: { backgroundColor: 'var(--color-bg-overlay)' },
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      testID={testID}
    >
      <AnimatedView style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <View style={styles.container}>
          <AnimatedView
            style={[styles.content, sizeStyles[size], variants[variant], contentStyle, style]}
          >
            {(title || description) && (
              <View style={styles.header}>
                {title && <Text style={styles.title}>{title}</Text>}
                {description && <Text style={styles.description}>{description}</Text>}
              </View>
            )}

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>

            {footer && <View style={styles.footer}>{footer}</View>}

            {showCloseButton && (
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                accessibilityLabel="Close dialog"
              >
                <X size={16} color="#6b7280" />
              </TouchableOpacity>
            )}
          </AnimatedView>
        </View>
      </AnimatedView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    borderRadius: 16,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 8,
  },
})
