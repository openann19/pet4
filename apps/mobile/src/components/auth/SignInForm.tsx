import { useState } from 'react'
import type React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useStorage } from '../../hooks/use-storage'
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

  const handleSubmit = async (): Promise<void> => {
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
      <Text style={styles.title}>{t.auth?.signInTitle || 'Welcome Back'}</Text>
      <Text style={styles.subtitle}>
        {t.auth?.signInSubtitle || 'Sign in to continue to PawfectMatch'}
      </Text>
      <View style={styles.form}>
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
            <Text style={styles.toggleText}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)">
          <Text style={styles.forgotText}>{t.auth?.forgotPassword || 'Forgot password?'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            void handleSubmit()
          }}
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="var(--color-bg-overlay)" />
          ) : (
            <Text style={styles.submitText}>{t.auth?.signIn || 'Sign In'}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>{t.auth?.or || 'or'}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>{t.auth?.noAccount || "Don't have an account?"} </Text>
          <TouchableOpacity onPress={onSwitchToSignUp} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)">
            <Text style={styles.signUpText}>{t.auth?.signUp || 'Sign up'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'var(--color-bg-overlay)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#222',
  },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#e53935',
  },
  error: {
    color: '#e53935',
    fontSize: 12,
    marginBottom: 8,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  toggleButton: {
    marginLeft: 8,
    padding: 4,
  },
  toggleText: {
    fontSize: 18,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: '#007AFF',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: 'var(--color-bg-overlay)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  orText: {
    marginHorizontal: 8,
    color: '#888',
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  switchText: {
    color: '#666',
    fontSize: 13,
  },
  signUpText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
})
