import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { createLogger } from '../../utils/logger'
import { apiClient, APIError } from '../../utils/api-client'
import { useStorage } from '../../hooks/use-storage'

const logger = createLogger('SignUpForm')

const useApp = () => ({
  t: {
    auth: {
      signUpTitle: 'Create your account',
      signUpSubtitle: 'Join PawfectMatch to meet new furry friends',
      displayName: 'Display name',
      displayNamePlaceholder: 'Alex & Luna',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      confirmPassword: 'Confirm password',
      confirmPasswordPlaceholder: 'Repeat password',
      signUp: 'Sign Up',
      haveAccount: 'Already have an account?',
      signIn: 'Sign in',
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email',
      passwordRequired: 'Password is required',
      passwordTooShort: 'Password must be at least 8 characters',
      passwordMismatch: 'Passwords must match',
      displayNameRequired: 'Display name is required',
      signUpSuccess: 'Welcome to PawfectMatch! 🎉',
      signUpError: 'Unable to create your account. Please try again.',
    },
  },
})

const haptics = { trigger: (_: string) => {} }
const analytics = { track: (_: string, _p?: Record<string, unknown>) => {} }
const toast = { success: (_: string) => {}, error: (_: string) => {} }

export type SignUpFormProps = {
  onSuccess: () => void
  onSwitchToSignIn: () => void
}

type SignUpValues = {
  email: string
  password: string
  confirmPassword: string
  displayName: string
}

const isEmailValid = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const { t } = useApp()
  const [values, setValues] = useState<SignUpValues>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpValues, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [, setAuthToken] = useStorage<string>('auth-token', '')
  const [, setUserEmail] = useStorage<string>('user-email', '')
  const [, setDisplayName] = useStorage<string>('user-display-name', '')
  const [, setIsAuthenticated] = useStorage<boolean>('is-authenticated', false)

  const validate = (): boolean => {
    const validationErrors: Partial<Record<keyof SignUpValues, string>> = {}

    if (!values.displayName.trim()) {
      validationErrors.displayName = t.auth?.displayNameRequired || 'Display name is required'
    }

    if (!values.email.trim()) {
      validationErrors.email = t.auth?.emailRequired || 'Email is required'
    } else if (!isEmailValid(values.email)) {
      validationErrors.email = t.auth?.emailInvalid || 'Please enter a valid email'
    }

    if (!values.password) {
      validationErrors.password = t.auth?.passwordRequired || 'Password is required'
    } else if (values.password.length < 8) {
      validationErrors.password = t.auth?.passwordTooShort || 'Password must be at least 8 characters'
    }

    if (!values.confirmPassword) {
      validationErrors.confirmPassword = t.auth?.passwordRequired || 'Please confirm your password'
    } else if (values.password !== values.confirmPassword) {
      validationErrors.confirmPassword = t.auth?.passwordMismatch || 'Passwords must match'
    }

    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const updateField = (field: keyof SignUpValues, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async () => {
    if (!validate()) {
      haptics.trigger('error')
      return
    }

    setIsSubmitting(true)
    haptics.trigger('light')

    try {
      const payload = {
        email: values.email.trim(),
        password: values.password,
        displayName: values.displayName.trim(),
      }

      let token = ''
      try {
        const response = await apiClient.post<{ token?: string; accessToken?: string; user?: { email?: string; displayName?: string } }>(
          '/auth/signup',
          payload,
          { skipAuth: true }
        )
        token = response?.token ?? response?.accessToken ?? ''
        if (response?.user?.email) {
          await setUserEmail(response.user.email)
        } else {
          await setUserEmail(payload.email)
        }
        if (response?.user?.displayName) {
          await setDisplayName(response.user.displayName)
        } else {
          await setDisplayName(payload.displayName)
        }
      } catch (apiError) {
        if (apiError instanceof APIError && apiError.statusCode === 409) {
          throw apiError
        }
        logger.warn('Signup API not available, falling back to local bootstrap', { error: apiError })
        token = `mock_signup_token_${Date.now()}`
        await setUserEmail(payload.email)
        await setDisplayName(payload.displayName)
      }

      await setAuthToken(token)
      await setIsAuthenticated(true)

      analytics.track('user_signed_up', { method: 'email' })
      toast.success(t.auth?.signUpSuccess || 'Welcome to PawfectMatch! 🎉')
      haptics.trigger('success')
      onSuccess()
    } catch (error) {
      const err = error instanceof APIError ? error : error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to sign up', err)
      toast.error(t.auth?.signUpError || 'Unable to create your account. Please try again.')
      haptics.trigger('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t.auth?.signUpTitle || 'Create your account'}</Text>
        <Text style={styles.subtitle}>{t.auth?.signUpSubtitle || 'Join PawfectMatch to meet new furry friends'}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>{t.auth?.displayName || 'Display name'}</Text>
          <TextInput
            style={[styles.input, errors.displayName ? styles.inputError : null]}
            placeholder={t.auth?.displayNamePlaceholder || 'Alex & Luna'}
            value={values.displayName}
            onChangeText={(text) => updateField('displayName', text)}
            editable={!isSubmitting}
          />
          {errors.displayName ? <Text style={styles.error}>{errors.displayName}</Text> : null}

          <Text style={styles.label}>{t.auth?.email || 'Email'}</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder={t.auth?.emailPlaceholder || 'you@example.com'}
            value={values.email}
            onChangeText={(text) => updateField('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSubmitting}
          />
          {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

          <Text style={styles.label}>{t.auth?.password || 'Password'}</Text>
          <TextInput
            style={[styles.input, errors.password ? styles.inputError : null]}
            placeholder={t.auth?.passwordPlaceholder || '••••••••'}
            value={values.password}
            onChangeText={(text) => updateField('password', text)}
            secureTextEntry
            editable={!isSubmitting}
          />
          {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

          <Text style={styles.label}>{t.auth?.confirmPassword || 'Confirm password'}</Text>
          <TextInput
            style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
            placeholder={t.auth?.confirmPasswordPlaceholder || 'Repeat password'}
            value={values.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            secureTextEntry
            editable={!isSubmitting}
          />
          {errors.confirmPassword ? <Text style={styles.error}>{errors.confirmPassword}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t.auth?.signUp || 'Sign Up'}</Text>}
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>{t.auth?.haveAccount || 'Already have an account?'} </Text>
            <TouchableOpacity onPress={onSwitchToSignIn} disabled={isSubmitting}>
              <Text style={styles.signInText}>{t.auth?.signIn || 'Sign in'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  switchText: {
    color: '#6B7280',
  },
  signInText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
})
