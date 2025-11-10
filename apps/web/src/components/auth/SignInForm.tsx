import { useState } from 'react';
import { EnvelopeSimple, LockKey, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { haptics } from '@/lib/haptics';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';
import OAuthButtons from './OAuthButtons';
import { createLogger } from '@/lib/logger';
import type { APIError } from '@/lib/contracts';

const logger = createLogger('SignInForm');

interface SignInFormProps {
  onSuccess: () => void;
  onSwitchToSignUp: () => void;
}

interface UserCredentials {
  email: string;
  password: string;
}

export default function SignInForm({ onSuccess, onSwitchToSignUp }: SignInFormProps): JSX.Element {
  const { t } = useApp();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserCredentials, string>>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserCredentials, string>> = {};

    if (!email.trim()) {
      newErrors.email = t.auth?.emailRequired || 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = t.auth?.emailInvalid || 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = t.auth?.passwordRequired || 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = t.auth?.passwordTooShort || 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      haptics.trigger('error');
      return;
    }

    setIsLoading(true);
    haptics.trigger('light');

    try {
      await login(email, password);

      analytics.track('user_signed_in', { email, method: 'email' });

      toast.success(t.auth?.signInSuccess || 'Welcome back!');
      haptics.trigger('success');

      onSuccess();
    } catch (error) {
      const err = error as APIError | Error;
      logger.error(
        'Sign in error',
        err instanceof Error ? err : new Error(err.message || 'Unknown error')
      );
      const errorMessage =
        'message' in err
          ? err.message
          : (err as APIError).message ||
            t.auth?.signInError ||
            'Failed to sign in. Please try again.';
      toast.error(errorMessage);
      haptics.trigger('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    haptics.trigger('selection');
    analytics.track('forgot_password_clicked');
    toast.info(t.auth?.forgotPasswordInfo || 'Password reset link would be sent to your email');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {t.auth?.signInTitle || 'Welcome Back'}
        </h2>
        <p className="text-muted-foreground">
          {t.auth?.signInSubtitle || 'Sign in to continue to PawfectMatch'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
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
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: '' }));
              }}
              className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
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
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: '' }));
              }}
              className={`pl-10 pr-12 ${errors.password ? 'border-destructive' : ''}`}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => {
                setShowPassword(!showPassword);
                haptics.trigger('selection');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            {t.auth?.forgotPassword || 'Forgot password?'}
          </button>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="w-full text-base font-semibold"
        >
          {isLoading ? t.common.loading || 'Loading...' : t.auth?.signIn || 'Sign In'}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-muted-foreground">{t.auth?.or || 'or'}</span>
          </div>
        </div>

        <OAuthButtons
          onGoogleSignIn={() => {
            haptics.trigger('light');
            analytics.track('oauth_clicked', { provider: 'google', action: 'signin' });
            // OAuth flow would handle sign-in
            toast.info(t.auth?.signInWithGoogle || 'Signing in with Google...');
          }}
          onAppleSignIn={() => {
            haptics.trigger('light');
            analytics.track('oauth_clicked', { provider: 'apple', action: 'signin' });
            // OAuth flow would handle sign-in
            toast.info(t.auth?.signInWithApple || 'Signing in with Apple...');
          }}
          disabled={isLoading}
        />

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {t.auth?.noAccount || "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-primary font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              {t.auth?.signUp || 'Sign up'}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
