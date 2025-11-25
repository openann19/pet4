import React, { useState, useCallback } from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withSpring, withTiming } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'
import { PremiumButton } from '../PremiumButton'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { isTruthy } from '@petspark/shared';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
const AnimatedView = Animated.View

export interface SplitButtonAction {
  label: string
  onPress: () => void
  icon?: React.ReactNode
  disabled?: boolean
}

export interface SplitButtonProps {
  mainAction: {
    label: string
    onPress: () => void
    icon?: React.ReactNode
    loading?: boolean
  }
  secondaryActions: SplitButtonAction[]
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  style?: ViewStyle
  testID?: string
}

const SPRING_CONFIG = { stiffness: 400, damping: 20 }

export function SplitButton({
  mainAction,
  secondaryActions,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  testID = 'split-button',
}: SplitButtonProps): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const dividerOpacity = useSharedValue(1)
  const menuOpacity = useSharedValue(0)
  const menuTranslateY = useSharedValue(100)
  const reducedMotion = useReducedMotionSV()
  const pressBounce = usePressBounce(0.95)

  const dividerStyle = useAnimatedStyle(() => ({
    opacity: dividerOpacity.value,
  }))

  const menuBackdropStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
  }))

  const menuContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: menuTranslateY.value }],
  }))

  const handleMainPress = useCallback((): void => {
    if (disabled) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    mainAction.onPress()
  }, [disabled, mainAction])

  const handleMenuToggle = useCallback(() => {
    if (isTruthy(disabled)) return
    const newState = !isMenuOpen
    setIsMenuOpen(newState)

    if (isTruthy(newState)) {
      dividerOpacity.value = withTiming(0.3, { duration: 200 })
      menuOpacity.value = withTiming(1, { duration: 200 })
      menuTranslateY.value = reducedMotion.value
        ? withTiming(0, { duration: 200 })
        : withSpring(0, SPRING_CONFIG)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } else {
      dividerOpacity.value = withSpring(1, SPRING_CONFIG)
      menuOpacity.value = withTiming(0, { duration: 150 })
      menuTranslateY.value = withTiming(100, { duration: 150 })
    }
  }, [disabled, isMenuOpen, dividerOpacity, menuOpacity, menuTranslateY, reducedMotion])

  const handleSecondaryAction = useCallback(
    (action: SplitButtonAction): void => {
      if (action.disabled) return
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      action.onPress()
      handleMenuToggle()
    },
    [handleMenuToggle]
  )

  return (
    <>
      <View style={[styles.container, style]} testID={testID}>
        <PremiumButton
          variant={variant}
          size={size}
          onPress={handleMainPress}
          disabled={disabled || mainAction.loading === true}
          loading={mainAction.loading === true}
          style={styles.mainButton}
        >
          {mainAction.icon && <View style={styles.iconContainer}>{mainAction.icon}</View>}
          <Text>{mainAction.label}</Text>
        </PremiumButton>

        <AnimatedView style={[styles.divider, dividerStyle]} />

        <AnimatedPressable
          onPress={handleMenuToggle}
          onPressIn={pressBounce.onPressIn}
          onPressOut={pressBounce.onPressOut}
          disabled={disabled}
          style={[
            styles.menuButton,
            {
              minHeight: size === 'sm' ? 44 : size === 'md' ? 44 : 44,
            },
            pressBounce.animatedStyle,
            disabled && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="More options"
          accessibilityState={{ disabled }}
        >
          <Text style={{ color: 'var(--color-bg-overlay)', fontSize: 16 }}>▼</Text>
        </AnimatedPressable>
      </View>

      <Modal
        visible={isMenuOpen}
        transparent
        animationType="none"
        onRequestClose={handleMenuToggle}
      >
        <AnimatedView style={[styles.modalBackdrop, menuBackdropStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleMenuToggle}
          />
          <AnimatedView style={[styles.menuContent, menuContentStyle]}>
            {secondaryActions.map((action, index) => (
              <Pressable
                key={index}
                onPress={() => { handleSecondaryAction(action); }}
                disabled={action.disabled}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                  action.disabled && styles.menuItemDisabled,
                ]}
              >
                {action.icon && <View style={styles.menuIcon}>{action.icon}</View>}
                <Text style={styles.menuItemText}>{action.label}</Text>
              </Pressable>
            ))}
          </AnimatedView>
        </AnimatedView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainButton: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  menuButton: {
    backgroundColor: 'var(--color-accent-secondary-9)',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    backgroundColor: 'var(--color-bg-overlay)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: 'var(--color-fg)',
    fontWeight: '500',
  },
  iconContainer: {
    marginRight: 8,
  },
})
