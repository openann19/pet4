import { useCallback, useState } from 'react'
import type React from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Animated } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { apiClient } from '@/utils/api-client'
import { createLogger } from '@/utils/logger'
import { saveAuthToken, saveRefreshToken } from '@/utils/secure-storage'
import { useStorage } from '@/hooks/use-storage'
import { EnhancedButton } from '../enhanced/EnhancedButton'
import { colors } from '../../theme/colors'
import { typography, spacing } from '../../theme/typography'
import { useReducedMotionSV } from '@petspark/motion'

export interface SignUpFormProps {
  readonly onSuccess: () => void
  readonly onSwitchToSignIn: () => void
}

export interface SignUpFormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  form?: string
}

export interface SignUpResponse {
  accessToken?: string
  refreshToken?: string
  user?: {
    id: string
    email: string
    name?: string
  }
}

const logger = createLogger('SignUpForm')

const useApp = (): {
  t: {
    auth: {
      signUpTitle: string
      signUpSubtitle: string
      email: string
      emailPlaceholder: string
      emailRequired: string
      emailInvalid: string
      password: string
      passwordPlaceholder: string
      passwordRequired: string
      passwordTooShort: string
      confirmPassword: string
      confirmPasswordPlaceholder: string
      confirmPasswordRequired: string
      passwordMismatch: string
      signUp: string
      signUpSuccess: string
      signUpError: string
      signIn: string
      alreadyHaveAccount: string
    }
    common: {
      loading: string
    }
  }
} => ({
  t: {
    auth: {
      signUpTitle: 'Create Account',
      signUpSubtitle: 'Join the community and find the perfect match for your pet.',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      password: 'Password',
      passwordPlaceholder: 'Enter a strong password',
      passwordRequired: 'Password is required',
      passwordTooShort: 'Password must be at least 8 characters',
      confirmPassword: 'Confirm password',
      confirmPasswordPlaceholder: 'Repeat your password',
      confirmPasswordRequired: 'Please confirm your password',
      passwordMismatch: 'Passwords do not match',
      signUp: 'Sign Up',
      signUpSuccess: 'Account created successfully!',
      signUpError: 'Unable to create your account. Please try again.',
      signIn: 'Sign in',
      alreadyHaveAccount: 'Already have an account?',
    },
    common: {
      loading: 'Loading...',
    },
  },
})

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps): React.JSX.Element {
  const { t } = useApp()
  const _reducedMotion = useReducedMotionSV()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<SignUpFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [, setAuthToken] = useStorage<string>('auth-token', '')
  const [, setRefreshToken] = useStorage<string>('refresh-token', '')
  const [, setUserEmail] = useStorage<string>('user-email', '')
  const [, setIsAuthenticated] = useStorage<boolean>('is-authenticated', false)

  const clearError = useCallback((key: keyof SignUpFormErrors) => {
    setErrors(prev => {
      if (!(key in prev)) {
        return prev
      }
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const validate = useCallback((): boolean => {
    const nextErrors: SignUpFormErrors = {}

    if (!email.trim()) {
      nextErrors.email = t.auth.emailRequired
    } else if (!validateEmail(email.trim())) {
      nextErrors.email = t.auth.emailInvalid
    }

    if (!password) {
      nextErrors.password = t.auth.passwordRequired
    } else if (password.length < 8) {
      nextErrors.password = t.auth.passwordTooShort
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = t.auth.confirmPasswordRequired
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = t.auth.passwordMismatch
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [
    confirmPassword,
    email,
    password,
    t.auth.confirmPasswordRequired,
    t.auth.emailInvalid,
    t.auth.emailRequired,
    t.auth.passwordMismatch,
    t.auth.passwordRequired,
    t.auth.passwordTooShort,
  ])

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    setIsSubmitting(true)
    clearError('form')
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      const payload = {
        email: email.trim(),
        password,
      }

      const response = await apiClient.post<SignUpResponse>('/auth/register', payload)

      const accessToken = response?.accessToken ?? null
      const refreshToken = response?.refreshToken ?? null

      if (accessToken) {
        // Save tokens - intentionally fire-and-forget with error logging
        void setAuthToken(accessToken)
        void saveAuthToken(accessToken)
        if (refreshToken) {
          void setRefreshToken(refreshToken)
          void saveRefreshToken(refreshToken)
        }
      }

      void setUserEmail(payload.email)
      void setIsAuthenticated(true)

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSuccess()
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : t.auth.signUpError
      logger.error('Sign up failed', error instanceof Error ? error : new Error(String(error)))
      setErrors(prev => ({ ...prev, form: message }))
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    clearError,
    email,
    onSuccess,
    password,
    setAuthToken,
    setIsAuthenticated,
    setRefreshToken,
    setUserEmail,
    t.auth.signUpError,
    validate,
  ])

  const handleSwitchToSignIn = useCallback(() => {
    void Haptics.selectionAsync()
    onSwitchToSignIn()
  }, [onSwitchToSignIn])

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoider}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={styles.container}>
          <Text style={styles.title}>{t.auth.signUpTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.signUpSubtitle}</Text>
        </Animated.View>

        <Animated.View style={styles.container}>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.auth.email}</Text>
            <TextInput
              accessibilityLabel={t.auth.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder={t.auth.emailPlaceholder}
              placeholderTextColor="#9CA3AF"
              style={[styles.input, errors.email ? styles.inputError : null]}
              value={email}
              onChangeText={value => {
                setEmail(value)
                clearError('email')
                clearError('form')
              }}
              editable={!isSubmitting}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.auth.password}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                accessibilityLabel={t.auth.password}
                placeholder={t.auth.passwordPlaceholder}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                style={[styles.input, errors.password ? styles.inputError : null, { flex: 1 }]}
                value={password}
                onChangeText={value => {
                  setPassword(value)
                  clearError('password')
                  clearError('form')
                }}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                onPress={() => {
                  setShowPassword(!showPassword)
                  void Haptics.selectionAsync()
                }}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
                style={styles.toggleButton}
              >
                <Text style={styles.toggleText}>{showPassword ? '✓' : '○'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.auth.confirmPassword}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                accessibilityLabel={t.auth.confirmPassword}
                placeholder={t.auth.confirmPasswordPlaceholder}
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                style={[styles.input, errors.confirmPassword ? styles.inputError : null, { flex: 1 }]}
                value={confirmPassword}
                onChangeText={value => {
                  setConfirmPassword(value)
                  clearError('confirmPassword')
                  clearError('form')
                }}
                editable={!isSubmitting}
              />
              <TouchableOpacity
                onPress={() => {
                  setShowConfirmPassword(!showConfirmPassword)
                  void Haptics.selectionAsync()
                }}
                accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
                style={styles.toggleButton}
              >
                <Text style={styles.toggleText}>{showConfirmPassword ? '✓' : '○'}</Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          {errors.form ? <Text style={styles.formErrorText}>{errors.form}</Text> : null}

          <EnhancedButton
            title={t.auth.signUp}
            onPress={handleSubmit}
            variant="default"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submitButton}
            hapticFeedback={true}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t.auth.alreadyHaveAccount} </Text>
            <TouchableOpacity
              onPress={handleSwitchToSignIn}
              disabled={isSubmitting}
              accessibilityLabel="Sign in"
              accessibilityRole="button"
            >
              <Text style={styles.switchLink}>{t.auth.signIn}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography['body-sm'],
    fontWeight: '500' as const,
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    color: colors.textPrimary,
    ...typography.body,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.danger,
    ...typography.caption,
  },
  formErrorText: {
    color: colors.danger,
    ...typography['body-sm'],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  submitButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    marginLeft: spacing.sm,
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  toggleText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  switchText: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  switchLink: {
    color: colors.primary,
    ...typography.caption,
    fontWeight: '600' as const,
  },
})

export default SignUpForm
