'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  AccessibilityInfo,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@mobile/effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
const AnimatedView = Animated.View

export interface DialogProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  showCloseButton?: boolean
  hapticFeedback?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
}

export interface DialogContentProps {
  children: React.ReactNode
  style?: ViewStyle
}

export interface DialogHeaderProps {
  children: React.ReactNode
  style?: ViewStyle
}

export interface DialogFooterProps {
  children: React.ReactNode
  style?: ViewStyle
}

export interface DialogTitleProps {
  children: React.ReactNode
  style?: TextStyle
}

export interface DialogDescriptionProps {
  children: React.ReactNode
  style?: TextStyle
}

// Motion constants (matching web tokens)
const MOTION_DURATIONS = {
  fast: 150,
  normal: 240,
  smooth: 320,
} as const

const SPRING_CONFIG = {
  damping: 25,
  stiffness: 400,
} as const

function DialogOverlay({
  visible,
  onPress,
  reducedMotion,
}: {
  visible: boolean
  onPress: () => void
  reducedMotion: boolean
}): React.JSX.Element {
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: reducedMotion ? MOTION_DURATIONS.fast : MOTION_DURATIONS.smooth,
    })
  }, [visible, opacity, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    }
  })

  return (
    <AnimatedPressable
      style={[styles.overlay, animatedStyle]}
      onPress={onPress}
      accessible={false}
      importantForAccessibility="no"
    />
  )
}

function DialogContent({
  visible,
  children,
  showCloseButton = true,
  hapticFeedback = true,
  onClose,
  reducedMotion,
  accessibilityLabel,
  accessibilityHint,
}: DialogProps & { reducedMotion: boolean }): React.JSX.Element {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.95)
  const y = useSharedValue(20)

  useEffect(() => {
    if (isTruthy(visible)) {
      opacity.value = withTiming(1, {
        duration: reducedMotion ? MOTION_DURATIONS.fast : MOTION_DURATIONS.smooth,
      })
      scale.value = withSpring(1, SPRING_CONFIG)
      y.value = withSpring(0, SPRING_CONFIG)
    } else {
      opacity.value = withTiming(0, {
        duration: reducedMotion ? MOTION_DURATIONS.fast : MOTION_DURATIONS.normal,
      })
      scale.value = withTiming(0.95, {
        duration: reducedMotion ? MOTION_DURATIONS.fast : MOTION_DURATIONS.normal,
      })
      y.value = withTiming(20, {
        duration: reducedMotion ? MOTION_DURATIONS.fast : MOTION_DURATIONS.normal,
      })
    }
  }, [visible, opacity, scale, y, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { translateY: y.value }],
    }
  })

  const handleClose = useCallback((): void => {
    if (isTruthy(hapticFeedback)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onClose()
  }, [hapticFeedback, onClose])

  useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility(accessibilityLabel || 'Dialog opened')
    }
  }, [visible, accessibilityLabel])

  if (!visible) {
    return <></>
  }

  return (
    <AnimatedView
      style={[styles.content, animatedStyle]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      {children}
      {showCloseButton && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          accessibilityHint="Closes the dialog"
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </AnimatedView>
  )
}

export function Dialog({
  visible,
  onClose,
  children,
  showCloseButton = true,
  hapticFeedback = true,
  accessibilityLabel,
  accessibilityHint,
}: DialogProps): React.JSX.Element {
  const reducedMotionSV = useReducedMotionSV()
  const [reducedMotion, setReducedMotion] = useState(() => reducedMotionSV.value)

  useEffect(() => {
    const checkReducedMotion = (): void => {
      setReducedMotion(reducedMotionSV.value)
    }

    // Initial check
    checkReducedMotion()

    // Check periodically (SharedValue changes don't trigger React re-renders)
    const intervalId = setInterval(checkReducedMotion, 100)

    return () => {
      clearInterval(intervalId)
    }
  }, [reducedMotionSV])

  const handleClose = useCallback((): void => {
    if (isTruthy(hapticFeedback)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onClose()
  }, [hapticFeedback, onClose])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      accessible={false}
    >
      <View style={styles.container}>
        <DialogOverlay visible={visible} onPress={handleClose} reducedMotion={reducedMotion} />
        <DialogContent
          visible={visible}
          onClose={handleClose}
          showCloseButton={showCloseButton}
          hapticFeedback={hapticFeedback}
          reducedMotion={reducedMotion}
          {...(accessibilityLabel && { accessibilityLabel })}
          {...(accessibilityHint && { accessibilityHint })}
        >
          {children}
        </DialogContent>
      </View>
    </Modal>
  )
}

export function DialogHeader({ children, style }: DialogHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.header, style]} accessible={false}>
      {children}
    </View>
  )
}

export function DialogFooter({ children, style }: DialogFooterProps): React.JSX.Element {
  return (
    <View style={[styles.footer, style]} accessible={false}>
      {children}
    </View>
  )
}

export function DialogTitle({ children, style }: DialogTitleProps): React.JSX.Element {
  return (
    <Text style={[styles.title, style]} accessible accessibilityRole="header">
      {children}
    </Text>
  )
}

export function DialogDescription({ children, style }: DialogDescriptionProps): React.JSX.Element {
  return (
    <Text style={[styles.description, style]} accessible accessibilityRole="text">
      {children}
    </Text>
  )
}

// Design token constants (matching web Dimens)
const DIMENS = {
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 24,
    dialog: 24,
  },
  elevation: {
    dialog: 12,
  },
  component: {
    touchTargetMin: 48,
    sheet: {
      paddingVertical: 24,
    },
  },
} as const

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'var(--color-bg-overlay)',
    borderRadius: DIMENS.radius.dialog,
    padding: DIMENS.component.sheet.paddingVertical,
    shadowColor: 'var(--color-fg)',
    shadowOffset: {
      width: 0,
      height: DIMENS.elevation.dialog,
    },
    shadowOpacity: 0.25,
    shadowRadius: DIMENS.elevation.dialog,
    elevation: DIMENS.elevation.dialog,
  },
  header: {
    marginBottom: DIMENS.spacing.lg,
  },
  footer: {
    marginTop: DIMENS.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: DIMENS.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: 'var(--color-fg)',
    marginBottom: DIMENS.spacing.sm,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },
  closeButton: {
    position: 'absolute',
    top: DIMENS.spacing.xl,
    right: DIMENS.spacing.xl,
    width: DIMENS.component.touchTargetMin,
    height: DIMENS.component.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DIMENS.radius.sm,
    opacity: 0.7,
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: 'var(--color-fg)',
    fontWeight: '300',
  },
})
