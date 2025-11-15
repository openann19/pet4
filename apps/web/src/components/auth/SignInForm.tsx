import { useState } from 'react'
import { motion, type Variants } from '@petspark/motion'
import { EnvelopeSimple, LockKey, Eye, EyeSlash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { haptics } from '@/lib/haptics'
import { analytics } from '@/lib/analytics'
import { toast } from 'sonner'
import OAuthButtons from './OAuthButtons'
import { createLogger } from '@/lib/logger'
import type { APIError } from '@/lib/contracts'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography'

const logger = createLogger('SignInForm')

type SignInFormProps = {
  onSuccess: () => void
  onSwitchToSignUp: () => void
}

type UserCredentials = {
  email: string
  password: string
}

export default function SignInForm({ onSuccess, onSwitchToSignUp }: SignInFormProps) {
  const { t } = useApp()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof UserCredentials, string>>>({})
  const shouldReduceMotion = useReducedMotion()
  
  const formVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: shouldReduceMotion 
        ? { duration: 0 }
        : { duration: 0.3 }
    }
  };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      haptics.trigger('error')
      return
    }

    setIsLoading(true)
    haptics.trigger('light')

    try {
      await login(email, password)

      analytics.track('user_signed_in', { email, method: 'email' })
      
      toast.success(t.auth?.signInSuccess || 'Welcome back!')
      haptics.trigger('success')
      
      onSuccess()
    } catch (error) {
      const err = error as APIError | Error
      logger.error('Sign in error', err instanceof Error ? err : new Error(err.message || 'Unknown error'))
      const errorMessage = 'message' in err ? err.message : (err as APIError).message || t.auth?.signInError || 'Failed to sign in. Please try again.'
      toast.error(errorMessage)
      haptics.trigger('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    haptics.trigger('selection')
    analytics.track('forgot_password_clicked')
    toast.info(t.auth?.forgotPasswordInfo || 'Password reset link would be sent to your email')
  }

  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      <div className={cn('text-center', getSpacingClassesFromConfig({ marginY: 'xl' }))}>
        <h2 className={cn(
          getTypographyClasses('h2'),
          'text-foreground',
          getSpacingClassesFromConfig({ marginY: 'sm' })
        )}>
          {t.auth?.signInTitle || 'Welcome Back'}
        </h2>
        <p className={cn(
          getTypographyClasses('body'),
          'text-muted-foreground'
        )}>
          {t.auth?.signInSubtitle || 'Sign in to continue to PawfectMatch'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={getSpacingClassesFromConfig({ spaceY: 'lg' })}>
        <div className={getSpacingClassesFromConfig({ spaceY: 'xs' })}>
          <Label htmlFor="email" className={cn(
            getTypographyClasses('body-sm'),
            'font-medium'
          )}>
            {t.auth?.email || 'Email'}
          </Label>
          <div className="relative">
            <EnvelopeSimple 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="email"
              type="email"
              placeholder={t.auth?.emailPlaceholder || 'you@example.com'}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors(prev => ({ ...prev, email: '' }))
              }}
              className={cn('pl-10', errors.email ? 'border-destructive' : '')}
              disabled={isLoading}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </div>
          {errors.email && (
            <p id="email-error" className={cn(
              getTypographyClasses('caption'),
              'text-destructive'
            )}>
              {errors.email}
            </p>
          )}
        </div>

        <div className={getSpacingClassesFromConfig({ spaceY: 'xs' })}>
          <Label htmlFor="password" className={cn(
            getTypographyClasses('body-sm'),
            'font-medium'
          )}>
            {t.auth?.password || 'Password'}
          </Label>
          <div className="relative">
            <LockKey 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t.auth?.passwordPlaceholder || '••••••••'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors(prev => ({ ...prev, password: '' }))
              }}
              className={cn('pl-10 pr-12', errors.password ? 'border-destructive' : '')}
              disabled={isLoading}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowPassword(!showPassword)
                haptics.trigger('selection')
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </Button>
          </div>
          {errors.password && (
            <p id="password-error" className={cn(
              getTypographyClasses('caption'),
              'text-destructive'
            )}>
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleForgotPassword}
            className="h-auto p-0"
          >
            {t.auth?.forgotPassword || 'Forgot password?'}
          </Button>
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={isLoading}
          className="w-full rounded-xl"
          onMouseEnter={() => !shouldReduceMotion && haptics.trigger('selection')}
        >
          {isLoading ? (t.common.loading || 'Loading...') : (t.auth?.signIn || 'Sign In')}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className={cn(
              getTypographyClasses('caption'),
              'bg-background text-muted-foreground',
              getSpacingClassesFromConfig({ paddingX: 'md' })
            )}>
              {t.auth?.or || 'or'}
            </span>
          </div>
        </div>

        <OAuthButtons
          onGoogleSignIn={() => {
            haptics.trigger('light')
            analytics.track('oauth_clicked', { provider: 'google', action: 'signin' })
            toast.info(t.auth?.signInWithGoogle || 'Signing in with Google...')
          }}
          onAppleSignIn={() => {
            haptics.trigger('light')
            analytics.track('oauth_clicked', { provider: 'apple', action: 'signin' })
            toast.info(t.auth?.signInWithApple || 'Signing in with Apple...')
          }}
          disabled={isLoading}
        />

        <div className="text-center">
          <p className={getTypographyClasses('body-sm')}>
            <span className="text-muted-foreground">
              {t.auth?.noAccount || "Don't have an account?"}{' '}
            </span>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onSwitchToSignUp}
              className="h-auto p-0 font-semibold"
            >
              {t.auth?.signUp || 'Sign up'}
            </Button>
          </p>
        </div>
      </form>
    </motion.div>
  )
}
