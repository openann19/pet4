import React, { useState, useCallback, useRef, useEffect } from 'react'
import { View, TextInput, Text, TouchableOpacity, StyleSheet, type ViewStyle, type TextInputProps } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import FeatherIcon from 'react-native-vector-icons/Feather'
import { isTruthy, isDefined } from '@/core/guards';

const Eye = (props: any) => <FeatherIcon name="eye" {...props} />
const EyeSlash = (props: any) => <FeatherIcon name="eye-off" {...props} />
const X = (props: any) => <FeatherIcon name="x" {...props} />
const CheckCircle = (props: any) => <FeatherIcon name="check-circle" {...props} />
const AlertCircle = (props: any) => <FeatherIcon name="alert-circle" {...props} />

export interface PremiumInputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
  showClearButton?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'
  fullWidth?: boolean
  onClear?: () => void
  style?: ViewStyle
  testID?: string
}

export function PremiumInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  showClearButton = false,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  value,
  onChangeText,
  onClear,
  type,
  editable = true,
  style,
  testID = 'premium-input',
  ...props
}: PremiumInputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [hasValue, setHasValue] = useState(Boolean(value))
  const inputRef = useRef<TextInput>(null)
  const reducedMotion = useReducedMotionSV()

  const labelScale = useSharedValue(hasValue || isFocused ? 0.85 : 1)
  const labelY = useSharedValue(hasValue || isFocused ? -24 : 0)
  const borderWidth = useSharedValue(variant === 'outlined' ? 1 : 0)
  const borderColor = useSharedValue(0)

  useEffect(() => {
    const hasContent = Boolean(value && String(value).length > 0)
    setHasValue(hasContent)

    const springConfig = reducedMotion.value
      ? { duration: 200 }
      : { stiffness: 400, damping: 30 }

    if (hasContent || isFocused) {
      labelScale.value = withSpring(0.85, springConfig)
      labelY.value = withSpring(-24, springConfig)
    } else {
      labelScale.value = withSpring(1, springConfig)
      labelY.value = withSpring(0, springConfig)
    }
  }, [value, isFocused, labelScale, labelY, reducedMotion])

  useEffect(() => {
    const timingConfig = { duration: 150 }
    if (isTruthy(isFocused)) {
      borderWidth.value = withSpring(2, { stiffness: 400, damping: 30 })
      borderColor.value = withTiming(error ? 1 : 0.5, timingConfig)
    } else {
      borderWidth.value = withSpring(variant === 'outlined' ? 1 : 0, { stiffness: 400, damping: 30 })
      borderColor.value = withTiming(error ? 1 : 0, timingConfig)
    }
  }, [isFocused, error, variant, borderWidth, borderColor])

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    props.onFocus?.(e)
  }, [props])

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false)
    props.onBlur?.(e)
  }, [props])

  const handleChangeText = useCallback((text: string) => {
    setHasValue(Boolean(text))
    onChangeText?.(text)
  }, [onChangeText])

  const handleClear = useCallback(() => {
    if (isTruthy(inputRef.current)) {
      setHasValue(false)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onChangeText?.('')
      onClear?.()
      inputRef.current.focus()
    }
  }, [onChangeText, onClear])

  const togglePassword = useCallback(() => {
    setShowPassword(!showPassword)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [showPassword])

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: labelScale.value },
      { translateY: labelY.value }
    ]
  }))

  const borderStyle = useAnimatedStyle(() => ({
    borderWidth: borderWidth.value,
    borderColor: borderColor.value === 1
      ? (error ? '#ef4444' : '#6366f1')
      : 'rgba(0, 0, 0, 0.1)'
  }))

  const inputType = showPasswordToggle && type === 'password'
    ? (showPassword ? 'default' : 'password')
    : type

  const sizes = {
    sm: { height: 40, fontSize: 14, padding: 12 },
    md: { height: 48, fontSize: 16, padding: 16 },
    lg: { height: 56, fontSize: 18, padding: 20 }
  }

  return (
    <View style={[fullWidth && styles.fullWidth, style]} testID={testID}>
      <Animated.View
        style={[
          styles.container,
          sizes[size],
          borderStyle,
          variant === 'filled' && styles.filled,
          variant === 'outlined' && styles.outlined,
          error && styles.error,
          !editable && styles.disabled
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}

        {label && (
          <Animated.View style={[styles.labelContainer, labelStyle]}>
            <Text
              style={[
                styles.label,
                sizes[size],
                isFocused && styles.labelFocused,
                error && styles.labelError
              ]}
            >
              {label}
            </Text>
          </Animated.View>
        )}

        <TextInput
          ref={inputRef}
          secureTextEntry={inputType === 'password'}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          style={[
            styles.input,
            sizes[size],
            label && styles.inputWithLabel
          ]}
          placeholderTextColor="#9ca3af"
          {...props}
        />

        <View style={styles.rightActions}>
          {showClearButton && hasValue && editable && (
            <TouchableOpacity onPress={handleClear} style={styles.actionButton}>
              <X size={16} color="#6b7280" />
            </TouchableOpacity>
          )}

          {showPasswordToggle && type === 'password' && (
            <TouchableOpacity onPress={togglePassword} style={styles.actionButton}>
              {showPassword ? (
                <EyeSlash size={16} color="#6b7280" />
              ) : (
                <Eye size={16} color="#6b7280" />
              )}
            </TouchableOpacity>
          )}

          {error && (
            <AlertCircle size={16} color="#ef4444" />
          )}

          {!error && hasValue && !showClearButton && (
            <CheckCircle size={16} color="#22c55e" />
          )}

          {rightIcon && (
            <View style={styles.rightIcon}>
              {rightIcon}
            </View>
          )}
        </View>
      </Animated.View>

      {(error || helperText) && (
        <View style={styles.helperContainer}>
          {error && <AlertCircle size={12} color="#ef4444" />}
          <Text style={[styles.helperText, error && styles.helperError]}>
            {error || helperText}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%'
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  filled: {
    backgroundColor: '#f3f4f6',
    borderWidth: 0
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1
  },
  error: {
    borderColor: '#ef4444'
  },
  disabled: {
    opacity: 0.5
  },
  leftIcon: {
    marginRight: 8,
    marginLeft: 16
  },
  labelContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 1
  },
  label: {
    fontWeight: '500',
    color: '#6b7280'
  },
  labelFocused: {
    color: '#6366f1'
  },
  labelError: {
    color: '#ef4444'
  },
  input: {
    flex: 1,
    color: '#111827'
  },
  inputWithLabel: {
    paddingTop: 24
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 16
  },
  actionButton: {
    padding: 4
  },
  rightIcon: {
    marginLeft: 8
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginLeft: 4
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280'
  },
  helperError: {
    color: '#ef4444'
  }
})
