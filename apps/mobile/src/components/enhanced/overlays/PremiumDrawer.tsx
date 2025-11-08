import React, { useEffect, useCallback } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import FeatherIcon from 'react-native-vector-icons/Feather'
import type { IconProps } from 'react-native-vector-icons/Icon'

const X = (props: Omit<IconProps, 'name'>): React.JSX.Element => <FeatherIcon name="x" {...props} />

const AnimatedView = Animated.View

export interface PremiumDrawerProps {
  visible?: boolean
  onClose?: () => void
  title?: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  closeOnBackdropPress?: boolean
  style?: ViewStyle
  testID?: string
}

export function PremiumDrawer({
  visible = false,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
  showCloseButton = true,
  closeOnBackdropPress = true,
  style,
  testID = 'premium-drawer',
}: PremiumDrawerProps): React.JSX.Element {
  const translateX = useSharedValue(side === 'right' ? 300 : side === 'left' ? -300 : 0)
  const translateY = useSharedValue(side === 'top' ? -300 : side === 'bottom' ? 300 : 0)
  const opacity = useSharedValue(0)
  const backdropOpacity = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    const springConfig = reducedMotion.value ? { duration: 300 } : { stiffness: 400, damping: 30 }
    const timingConfig = { duration: 200 }

    if (visible) {
      if (side === 'right' || side === 'left') {
        translateX.value = withSpring(0, springConfig)
      } else {
        translateY.value = withSpring(0, springConfig)
      }
      opacity.value = withTiming(1, timingConfig)
      backdropOpacity.value = withTiming(1, timingConfig)
    } else {
      if (side === 'right') {
        translateX.value = withSpring(300, springConfig)
      } else if (side === 'left') {
        translateX.value = withSpring(-300, springConfig)
      } else if (side === 'top') {
        translateY.value = withSpring(-300, springConfig)
      } else {
        translateY.value = withSpring(300, springConfig)
      }
      opacity.value = withTiming(0, timingConfig)
      backdropOpacity.value = withTiming(0, timingConfig)
    }
  }, [visible, side, translateX, translateY, opacity, backdropOpacity, reducedMotion])

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
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
    sm: { width: '75%', maxWidth: 320 },
    md: { width: '75%', maxWidth: 400 },
    lg: { width: '85%', maxWidth: 500 },
    xl: { width: '90%', maxWidth: 600 },
  }

  const sideStyles: Record<string, ViewStyle> = {
    top: {
      top: 0,
      left: 0,
      right: 0,
      height: 'auto',
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    right: {
      top: 0,
      right: 0,
      bottom: 0,
      height: '100%',
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    },
    bottom: {
      bottom: 0,
      left: 0,
      right: 0,
      height: 'auto',
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    left: {
      top: 0,
      left: 0,
      bottom: 0,
      height: '100%',
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
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
        <AnimatedView
          style={[styles.content, sizeStyles[size], sideStyles[side], contentStyle, style]}
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
              accessibilityLabel="Close drawer"
            >
              <X size={16} color="#6b7280" />
            </TouchableOpacity>
          )}
        </AnimatedView>
      </AnimatedView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    flex: 1,
    padding: 24,
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
