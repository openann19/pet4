/**
 * Mobile SignUp form with validation and API integration.
 * Location: apps/mobile/src/components/auth/SignUpForm.tsx
 */

import { useCallback, useState } from 'react'
import type React from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { apiClient } from '@/utils/api-client'
import { createLogger } from '@/utils/logger'
import { saveAuthToken, saveRefreshToken } from '@/utils/secure-storage'
import { useStorage } from '@/hooks/use-storage'

type SignUpFormProps = {
  readonly onSuccess: () => void
  readonly onSwitchToSignIn: () => void
}

type SignUpFormErrors = Partial<Record<'email' | 'password' | 'confirmPassword', string>> & {
  form?: string
}

type SignUpResponse = {
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

const haptics = {
  trigger: (_: 'success' | 'error' | 'light' | 'selection') => {},
}

const analytics = {
  track: (_: string, __?: Record<string, unknown>) => {},
}

const toast = {
  success: (_: string) => {},
  error: (_: string) => {},
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps): React.JSX.Element {
  const { t } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
      haptics.trigger('error')
      return
    }

    setIsSubmitting(true)
    clearError('form')
    haptics.trigger('light')

    try {
      const payload = {
        email: email.trim(),
        password,
      }

      const response = await apiClient.post<SignUpResponse>('/auth/register', payload)

      const accessToken = response?.accessToken ?? null
      const refreshToken = response?.refreshToken ?? null

      if (accessToken) {
        await Promise.all([
          setAuthToken(accessToken),
          saveAuthToken(accessToken),
          refreshToken ? setRefreshToken(refreshToken) : Promise.resolve(),
          refreshToken ? saveRefreshToken(refreshToken) : Promise.resolve(),
        ])
        analytics.track('auth_tokens_saved')
      }

      await setUserEmail(payload.email)
      await setIsAuthenticated(true)

      analytics.track('user_signed_up', { email: payload.email })
      toast.success(t.auth.signUpSuccess)
      haptics.trigger('success')
      onSuccess()
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : t.auth.signUpError
      logger.error('Sign up failed', error instanceof Error ? error : new Error(String(error)))
      setErrors(prev => ({ ...prev, form: message }))
      toast.error(message)
      haptics.trigger('error')
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
    t.auth.signUpSuccess,
    validate,
  ])

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoider}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>{t.auth.signUpTitle}</Text>
          <Text style={styles.subtitle}>{t.auth.signUpSubtitle}</Text>

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
            <TextInput
              accessibilityLabel={t.auth.password}
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={[styles.input, errors.password ? styles.inputError : null]}
              value={password}
              onChangeText={value => {
                setPassword(value)
                clearError('password')
                clearError('form')
              }}
              editable={!isSubmitting}
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{t.auth.confirmPassword}</Text>
            <TextInput
              accessibilityLabel={t.auth.confirmPassword}
              placeholder={t.auth.confirmPasswordPlaceholder}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
              value={confirmPassword}
              onChangeText={value => {
                setConfirmPassword(value)
                clearError('confirmPassword')
                clearError('form')
              }}
              editable={!isSubmitting}
            />
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          {errors.form ? <Text style={styles.formErrorText}>{errors.form}</Text> : null}

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              void handleSubmit()
            }}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{t.auth.signUp}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t.auth.alreadyHaveAccount} </Text>
            <TouchableOpacity onPress={onSwitchToSignIn} disabled={isSubmitting}>
              <Text style={styles.switchLink}>{t.auth.signIn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#111827',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    marginTop: 6,
    color: '#DC2626',
    fontSize: 12,
  },
  formErrorText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  switchText: {
    color: '#6B7280',
    fontSize: 13,
  },
  switchLink: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },
})

export default SignUpForm
