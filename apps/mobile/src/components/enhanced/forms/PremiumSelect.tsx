import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
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
import { isTruthy } from '@petspark/shared';

const AnimatedView = Animated.View

export interface PremiumSelectOption {
  label: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface PremiumSelectProps {
  options: PremiumSelectOption[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  multiSelect?: boolean
  label?: string
  placeholder?: string
  variant?: 'default' | 'filled' | 'outlined' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  searchable?: boolean
  error?: string
  helperText?: string
  disabled?: boolean
  style?: ViewStyle
  testID?: string
  accessibilityLabel: string
}

const SPRING_CONFIG = { stiffness: 400, damping: 20 }

export function PremiumSelect({
  options,
  value,
  onValueChange,
  multiSelect = false,
  label,
  placeholder = 'Select...',
  variant = 'default',
  size = 'md',
  searchable = false,
  error,
  helperText,
  disabled = false,
  style,
  testID = 'premium-select',
  accessibilityLabel,
}: PremiumSelectProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const selectedValues = useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value]
  )
  const reducedMotion = useReducedMotionSV()

  const modalOpacity = useSharedValue(0)
  const contentScale = useSharedValue(0.95)

  const filteredOptions = searchable
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options

  const handleOpen = useCallback(() => {
    if (isTruthy(disabled)) return
    setIsOpen(true)
    if (isTruthy(reducedMotion.value)) {
      modalOpacity.value = withTiming(1, { duration: 200 })
      contentScale.value = withTiming(1, { duration: 200 })
    } else {
      modalOpacity.value = withSpring(1, SPRING_CONFIG)
      contentScale.value = withSpring(1, SPRING_CONFIG)
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [disabled, modalOpacity, contentScale, reducedMotion])

  const handleClose = useCallback((): void => {
    setIsOpen(false)
    setSearchQuery('')
    modalOpacity.value = withTiming(0, { duration: 150 })
    contentScale.value = withTiming(0.95, { duration: 150 })
  }, [modalOpacity, contentScale])

  const handleSelect = useCallback(
    (optionValue: string): void => {
      if (multiSelect) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue]
        onValueChange?.(newValues)
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } else {
        onValueChange?.(optionValue)
        handleClose()
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
    },
    [multiSelect, selectedValues, onValueChange, handleClose]
  )

  const displayValue = multiSelect
    ? selectedValues.length > 0
      ? `${String(selectedValues.length ?? '')} selected`
      : placeholder
    : options.find(opt => opt.value === value)?.label || placeholder

  const modalBackdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }))

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }))

  const variantStyles: Record<string, ViewStyle> = {
    default: { backgroundColor: 'var(--color-bg-overlay)', borderColor: '#e2e8f0' },
    filled: { backgroundColor: '#f1f5f9', borderColor: 'transparent' },
    outlined: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#e2e8f0' },
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
  }

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { height: 36, paddingHorizontal: 12 },
    md: { height: 48, paddingHorizontal: 16 },
    lg: { height: 56, paddingHorizontal: 20 },
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        style={[
          styles.trigger,
          variantStyles[variant],
          sizeStyles[size],
          error ? styles.errorBorder : undefined,
          disabled && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
      >
        <Text
          style={[
            styles.triggerText,
            textSizeStyles[size],
            displayValue === placeholder && styles.placeholder,
          ]}
        >
          {displayValue}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </Pressable>

      {(error || helperText) && (
        <Text style={error ? [styles.helperText, styles.errorText] : styles.helperText}>
          {error || helperText}
        </Text>
      )}

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleClose}>
        <AnimatedView style={[styles.modalBackdrop, modalBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} / className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)">
          <AnimatedView style={[styles.modalContent, contentStyle]}>
            {searchable && (
              <View style={styles.searchContainer}>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search..."
                  style={styles.searchInput}
                  autoFocus
                />
              </View>
            )}

            <ScrollView style={styles.optionsList}>
              {filteredOptions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No options found</Text>
                </View>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = selectedValues.includes(option.value)
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => { handleSelect(option.value); }}
                      disabled={option.disabled}
                      style={({ pressed }) => [
                        styles.option,
                        pressed && styles.optionPressed,
                        isSelected && styles.optionSelected,
                        option.disabled && styles.optionDisabled,
                      ]}
                    >
                      {option.icon && <View style={styles.optionIcon}>{option.icon}</View>}
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {option.label}
                      </Text>
                      {isSelected && multiSelect && <Text style={styles.checkIcon}>✓</Text>}
                    </Pressable>
                  )
                })
              )}
            </ScrollView>
          </AnimatedView>
        </AnimatedView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: 'var(--color-fg)',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  triggerText: {
    flex: 1,
    color: 'var(--color-fg)',
  },
  placeholder: {
    color: '#94a3b8',
  },
  chevron: {
    fontSize: 12,
    color: '#64748b',
  },
  errorBorder: {
    borderColor: 'var(--color-error-9)',
  },
  disabled: {
    opacity: 0.5,
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748b',
  },
  errorText: {
    color: 'var(--color-error-9)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'var(--color-bg-overlay)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: 'var(--color-bg-overlay)',
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  optionPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: 'var(--color-fg)',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: 'var(--color-accent-secondary-9)',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  checkIcon: {
    fontSize: 16,
    color: 'var(--color-accent-secondary-9)',
    fontWeight: 'bold',
  },
})
