import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { EnvelopeSimple, LockKey, User, Eye, EyeSlash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { haptics } from '@/lib/haptics'
import { analytics } from '@/lib/analytics'
import { toast } from 'sonner'
import OAuthButtons from './OAuthButtons'
import AgeGateModal from './AgeGateModal'
import { recordConsent } from '@/lib/kyc-service'
import { createLogger } from '@/lib/logger'
import type { APIError } from '@/lib/contracts'
import { isTruthy } from '@petspark/shared'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography'

const logger = createLogger('SignUpForm')

type SignUpFormProps = {
  onSuccess: () => void
  onSwitchToSignIn: () => void
}

type SignUpData = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export default function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const { t } = useApp()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpData | 'terms', string>>>({})
  const [showAgeGate, setShowAgeGate] = useState(false)
  const [ageVerified, setAgeVerified] = useState(false)
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
    const newErrors: Partial<Record<keyof SignUpData | 'terms', string>> = {}

    if (!name.trim()) {
      newErrors.name = t.auth?.nameRequired || 'Name is required'
    } else if (name.trim().length < 2) {
      newErrors.name = t.auth?.nameTooShort || 'Name must be at least 2 characters'
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = t.auth?.confirmPasswordRequired || 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t.auth?.passwordMismatch || 'Passwords do not match'
    }

    if (!agreeToTerms) {
      newErrors.terms = t.auth?.termsRequired || 'You must agree to the Terms and Privacy Policy'
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

    // Check age verification
    if (!ageVerified) {
      setShowAgeGate(true)
      return
    }

    setIsLoading(true)
    haptics.trigger('light')

    try {
      const user = await register(email, password, name)

      // Record consents
      await recordConsent(user.id, 'terms', '1.0', true)
      await recordConsent(user.id, 'privacy', '1.0', true)

      analytics.track('user_signed_up', { email, method: 'email' })
      
      toast.success(t.auth?.signUpSuccess || 'Account created successfully!')
      haptics.trigger('success')
      
      onSuccess()
    } catch (error) {
      const err = error as APIError | Error
      logger.error('Sign up error', err instanceof Error ? err : new Error(err.message || 'Unknown error'))
      const errorMessage = 'message' in err ? err.message : (err as APIError).message || t.auth?.signUpError || 'Failed to create account. Please try again.'
      toast.error(errorMessage)
      haptics.trigger('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgeVerified = (_country?: string) => {
    setAgeVerified(true)
    setShowAgeGate(false)
    // Continue with sign-up
    const form = document.querySelector('form')!
    if (isTruthy(form)) {
      form.requestSubmit()
    }
  }

  const handleOAuthSuccess = (provider: 'google' | 'apple') => {
    try {
      haptics.trigger('light')
      analytics.track('oauth_success', { provider })
      
      // OAuth flow would handle age verification server-side
      // For now, show age gate if needed
      if (!ageVerified) {
        setShowAgeGate(true)
      } else {
        toast.success(t.auth?.signUpSuccess || 'Account created successfully!')
        onSuccess()
      }
    } catch (error) {
      logger.error('OAuth error', error instanceof Error ? error : new Error(String(error)))
      toast.error(t.auth?.signUpError || 'Failed to sign up. Please try again.')
    }
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
          {t.auth?.signUpTitle || 'Create Account'}
        </h2>
        <p className={cn(
          getTypographyClasses('body'),
          'text-muted-foreground'
        )}>
          {t.auth?.signUpSubtitle || 'Join PawfectMatch to find your pet\'s perfect companion'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={getSpacingClassesFromConfig({ spaceY: 'lg' })}>
        <div className="space-y-1">
          <Label htmlFor="name" className="block text-sm font-medium mb-1">
            {t.auth?.name || 'Full Name'}
          </Label>
          <div className="relative">
            <User 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="name"
              type="text"
              placeholder={t.auth?.namePlaceholder || 'John Doe'}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors(prev => ({ ...prev, name: '' }))
              }}
              className={`pl-10 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`}
              disabled={isLoading}
              autoComplete="name"
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="email" className="block text-sm font-medium mb-1">
            {t.auth?.email || 'Email'}
          </Label>
          <div className="relative">
            <EnvelopeSimple 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
              className={`pl-10 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password" className="block text-sm font-medium mb-1">
            {t.auth?.password || 'Password'}
          </Label>
          <div className="relative">
            <LockKey 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
              className={`pl-10 pr-12 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : ''}`}
              disabled={isLoading}
              autoComplete="new-password"
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
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            {t.auth?.confirmPassword || 'Confirm Password'}
          </Label>
          <div className="relative">
            <LockKey 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t.auth?.confirmPasswordPlaceholder || '••••••••'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setErrors(prev => ({ ...prev, confirmPassword: '' }))
              }}
              className={`pl-10 pr-12 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowConfirmPassword(!showConfirmPassword)
                haptics.trigger('selection')
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => {
                setAgreeToTerms(checked as boolean)
                setErrors(prev => ({ ...prev, terms: '' }))
                haptics.trigger('selection')
              }}
              disabled={isLoading}
              className={errors.terms ? 'border-red-500' : ''}
            />
            <label
              htmlFor="terms"
              className="text-sm text-muted-foreground leading-tight cursor-pointer"
            >
              {t.auth?.agreeToTerms || 'I agree to the'}{' '}
              <a
                href="https://github.com/site/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                onClick={(e) => { e.stopPropagation(); }}
              >
                {t.auth?.terms || 'Terms of Service'}
              </a>
              {' '}{t.auth?.and || 'and'}{' '}
              <a
                href="https://github.com/site/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                onClick={(e) => { e.stopPropagation(); }}
              >
                {t.auth?.privacyPolicy || 'Privacy Policy'}
              </a>
            </label>
          </div>
          {errors.terms && (
            <p className="text-red-500 text-sm mt-1">{errors.terms}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={isLoading}
          className="w-full rounded-xl"
          onMouseEnter={() => !shouldReduceMotion && haptics.trigger('selection')}
        >
          {isLoading ? (t.common.loading || 'Loading...') : (t.auth?.createAccount || 'Create Account')}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-muted-foreground">
              {t.auth?.or || 'or'}
            </span>
          </div>
        </div>

        <OAuthButtons
          onGoogleSignIn={() => { handleOAuthSuccess('google') }}
          onAppleSignIn={() => { handleOAuthSuccess('apple') }}
          disabled={isLoading}
        />

        <div className="text-center">
          <p className={getTypographyClasses('body-sm')}>
            <span className="text-muted-foreground">
              {t.auth?.hasAccount || 'Already have an account?'}{' '}
            </span>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onSwitchToSignIn}
              className="h-auto p-0 font-semibold"
            >
              {t.auth?.signIn || 'Sign in'}
            </Button>
          </p>
        </div>
      </form>

      <AgeGateModal
        open={showAgeGate}
        onVerified={() => { handleAgeVerified() }}
        onClose={() => { setShowAgeGate(false); }}
      />
    </motion.div>
  )
}
