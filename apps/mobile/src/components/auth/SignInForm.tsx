import { useState } from 'react'
import type React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { useStorage } from '../../hooks/use-storage'
import { EnhancedButton } from '../enhanced/EnhancedButton'
import { colors } from '../../theme/colors'
import { typography, spacing } from '../../theme/typography'
// Stubs for missing web-only modules
const useApp = (): {
  t: {
    auth: {
      emailRequired: string
      emailInvalid: string
      passwordRequired: string
      passwordTooShort: string
      signInSuccess: string
      signInError: string
      forgotPasswordInfo: string
      signInTitle: string
      signInSubtitle: string
      email: string
      emailPlaceholder: string
      password: string
      passwordPlaceholder: string
      forgotPassword: string
      signIn: string
      noAccount: string
      signUp: string
      or: string
    }
    common: {
      loading: string
    }
  }
} => ({
  t: {
    auth: {
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email',
      passwordRequired: 'Password is required',
      passwordTooShort: 'Password must be at least 6 characters',
      signInSuccess: 'Welcome back!',
      signInError: 'Failed to sign in. Please try again.',
      forgotPasswordInfo: 'Password reset link would be sent to your email',
      signInTitle: 'Welcome Back',
      signInSubtitle: 'Sign in to continue to PawfectMatch',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: '••••••••',
      forgotPassword: 'Forgot password?',
      signIn: 'Sign In',
      noAccount: "Don't have an account?",
      signUp: 'Sign up',
      or: 'or',
    },
    common: { loading: 'Loading...' },
  },
})

const haptics = { trigger: (_: string) => {} }
const analytics = { track: (_: string, _p?: Record<string, unknown>) => {} }
const toast = { success: (_: string) => {}, error: (_: string) => {}, info: (_: string) => {} }

export type SignInFormProps = {
  onSuccess: () => void
  onSwitchToSignUp: () => void
}

export type UserCredentials = {
  email: string
  password: string
}

export default function SignInForm({
  onSuccess,
  onSwitchToSignUp,
}: SignInFormProps): React.JSX.Element {
  const { t } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof UserCredentials, string>>>({})

  // useStorage returns [value, setValue, deleteValue] - 3 elements
  const [, setAuthToken] = useStorage<string>('auth-token', '')
  const [, setUserEmail] = useStorage<string>('user-email', '')
  const [, setIsAuthenticated] = useStorage<boolean>('is-authenticated', false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserCredentials, string>> = {}

    if (!email.trim()) {
      newErrors.email = t.auth?.emailRequired || 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = t.auth?.emailInvalid || 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = t.auth?.passwordRequired || 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = t.auth?.passwordTooShort || 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      haptics.trigger('error')
      return
    }

    setIsLoading(true)
    haptics.trigger('light')

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mockToken = `mock_token_${String(Date.now() ?? '')}`
      await setAuthToken(mockToken)
      await setUserEmail(email)
      await setIsAuthenticated(true)
      analytics.track('user_signed_in', { email, method: 'email' })
      toast.success(t.auth?.signInSuccess || 'Welcome back!')
      haptics.trigger('success')
      onSuccess()
    } catch {
      toast.error(t.auth?.signInError || 'Failed to sign in. Please try again.')
      haptics.trigger('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = (): void => {
    haptics.trigger('selection')
    analytics.track('forgot_password_clicked')
    toast.info(t.auth?.forgotPasswordInfo || 'Password reset link would be sent to your email')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Animated.View entering={FadeInUp.duration(400).delay(100)}>
        <Text style={styles.title}>{t.auth?.signInTitle || 'Welcome Back'}</Text>
        <Text style={styles.subtitle}>
          {t.auth?.signInSubtitle || 'Sign in to continue to PawfectMatch'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.form}>
        <Text style={styles.label}>{t.auth?.email || 'Email'}</Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder={t.auth?.emailPlaceholder || 'you@example.com'}
          value={email}
          onChangeText={text => {
            setEmail(text)
            setErrors(prev => ({ ...prev, email: '' }))
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

        <Text style={styles.label}>{t.auth?.password || 'Password'}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, errors.password ? styles.inputError : null, { flex: 1 }]}
            placeholder={t.auth?.passwordPlaceholder || '••••••••'}
            value={password}
            onChangeText={text => {
              setPassword(text)
              setErrors(prev => ({ ...prev, password: '' }))
            }}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => {
              setShowPassword(!showPassword)
              haptics.trigger('selection')
            }}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>{showPassword ? '✓' : '○'}</Text>
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
          <Text style={styles.forgotText}>{t.auth?.forgotPassword || 'Forgot password?'}</Text>
        </TouchableOpacity>

        <EnhancedButton
          title={t.auth?.signIn || 'Sign In'}
          onPress={handleSubmit}
          variant="default"
          size="lg"
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
          hapticFeedback={true}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>{t.auth?.or || 'or'}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{t.auth?.noAccount || "Don't have an account?"} </Text>
          <TouchableOpacity onPress={onSwitchToSignUp}>
            <Text style={styles.signUpText}>{t.auth?.signUp || 'Sign up'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
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
  form: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    ...typography['body-sm'],
    fontWeight: '500',
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  input: {
    height: 48,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.card,
    ...typography.body,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    color: colors.danger,
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  toggleButton: {
    marginLeft: spacing.sm,
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    color: colors.primary,
    ...typography.caption,
  },
  submitButton: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orText: {
    marginHorizontal: spacing.sm,
    color: colors.textSecondary,
    ...typography.caption,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  switchText: {
    color: colors.textSecondary,
    ...typography.caption,
  },
  signUpText: {
    color: colors.primary,
    fontWeight: 'bold',
    ...typography.caption,
  },
})
