'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EnvelopeSimple, LockKey, Eye, EyeSlash } from '@phosphor-icons/react';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { haptics } from '@/lib/haptics';
import { analytics, hashEmail } from '@/lib/analytics';
import { toast } from 'sonner';
import OAuthButtons from './OAuthButtons';
import { createLogger } from '@/lib/logger';
import type { APIError } from '@/lib/contracts';
import { authApi } from '@/api/auth-api';

const logger = createLogger('SignInForm');

// define schema outside render
const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

interface SignInFormProps {
  onSuccess: () => void;
  onSwitchToSignUp: () => void;
}

type UserCredentials = z.infer<typeof signInSchema>;

export default function SignInForm({ onSuccess, onSwitchToSignUp }: SignInFormProps): JSX.Element {
  const { t } = useApp();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const form = useForm<UserCredentials>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetLoading = (val: boolean) => {
    if (mountedRef.current) setIsLoading(val);
  };

  const onSubmit = async (data: UserCredentials) => {
    safeSetLoading(true);
    haptics.trigger('light');

    try {
      const user = await login(data.email, data.password);
      const hashedEmail = await hashEmail(data.email);

      if (analytics?.track) {
        try {
          analytics.track('user_signed_in', {
            userId: user.id,
            emailHash: hashedEmail,
            method: 'email',
          });
        } catch (aerr) {
          logger.warn('Analytics tracking failed', aerr);
        }
      }

      toast.success(t.auth?.signInSuccess || 'Welcome back!');
      haptics.trigger('success');
      onSuccess();
    } catch (error) {
      const err = error as APIError | Error;
      logger.error('Sign in error', err);
      const message =
        'message' in err
          ? err.message
          : (err as APIError).message || t.auth?.signInError || 'Failed to sign in. Please try again.';
      toast.error(message);
      haptics.trigger('error');
    } finally {
      safeSetLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    haptics.trigger('selection');
    try {
      analytics?.track('forgot_password_clicked');
    } catch {
      // Analytics tracking failed, silently ignore
    }

    const email = form.getValues('email');
    if (!email.trim()) {
      toast.error(t.auth?.emailRequired ?? 'Please enter your email address first');
      form.setFocus('email');
      return;
    }

    try {
      safeSetLoading(true);
      await authApi.forgotPassword({ email });
      const successMessage: string = t.auth?.forgotPasswordSuccess ?? 'Password reset link has been sent to your email';
      toast.success(successMessage);
      try {
        const emailHash = await hashEmail(email);
        analytics?.track('forgot_password_sent', { emailHash });
      } catch {
        // Analytics tracking failed, silently ignore
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      const errorMessage: string = err.message || (t.auth?.forgotPasswordError ?? 'Failed to send password reset email. Please try again.');
      logger.error('Forgot password error', err);
      toast.error(errorMessage);
      haptics.trigger('error');
    } finally {
      safeSetLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-[24px] p-8 sm:p-12">
      <div className="text-center mb-8">
        <h2 className="text-[32px] font-bold text-(--text-primary) mb-2 tracking-tight">
          {t.auth?.signInTitle || 'Welcome Back'}
        </h2>
        <p className="text-[15px] text-(--text-secondary)">
          {t.auth?.signInSubtitle || 'Sign in to continue'}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-5"
          noValidate
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-(--text-primary) block mb-2">
                  {t.auth?.email || 'Email'}
                </FormLabel>
                <div className="relative">
                  <EnvelopeSimple
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-tertiary) pointer-events-none"
                  />
                  <input
                    {...field}
                    type="email"
                    placeholder={t.auth?.emailPlaceholder || 'you@example.com'}
                    className="w-full h-12 pl-12 pr-4 bg-white border border-(--color-neutral-6) rounded-xl text-base text-(--color-fg) placeholder:text-(--color-fg-secondary) focus:border-(--color-accent-9) focus:ring-2 focus:ring-(--color-focus-ring) focus:ring-offset-2 focus:outline-none disabled:opacity-50 transition-colors"
                    disabled={isLoading}
                    autoComplete="email"
                    aria-label="Email address"
                  />
                </div>
                <FormMessage className="text-[13px] text-(--error) mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium text-(--text-primary) block mb-2">
                  {t.auth?.password || 'Password'}
                </FormLabel>
                <div className="relative">
                  <LockKey
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-tertiary) pointer-events-none"
                  />
                  <input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.auth?.passwordPlaceholder || '••••••••'}
                    className="w-full h-12 pl-12 pr-12 bg-white border border-(--color-neutral-6) rounded-xl text-base text-(--color-fg) placeholder:text-(--color-fg-secondary) focus:border-(--color-accent-9) focus:ring-2 focus:ring-(--color-focus-ring) focus:ring-offset-2 focus:outline-none disabled:opacity-50 transition-colors"
                    disabled={isLoading}
                    autoComplete="current-password"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassword((v) => !v);
                      haptics.trigger('selection');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-(--text-tertiary) hover:text-(--text-primary) transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FormMessage className="text-[13px] text-(--error) mt-1" />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                void handleForgotPassword();
              }}
              disabled={isLoading}
              className="text-[13px] text-(--coral-primary) font-medium hover:underline focus:outline-none disabled:opacity-50"
            >
              {t.auth?.forgotPassword ?? 'Forgot password?'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-(--color-accent-9) hover:bg-(--color-accent-10) active:bg-(--color-accent-11) text-white text-base font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-(--color-focus-ring) focus:ring-offset-2"
          >
            {isLoading ? t.common.loading || 'Loading...' : t.auth?.signIn || 'Sign In'}
          </button>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-(--border-light)" />
            </div>
            <div className="relative flex justify-center text-[13px]">
              <span className="px-4 bg-white text-(--text-secondary)">
                {t.auth?.or || 'or'}
              </span>
            </div>
          </div>

          <OAuthButtons
            onGoogleSignIn={() => {
              haptics.trigger('light');
              if (analytics?.track) {
                analytics.track('oauth_clicked', { provider: 'google', action: 'signin' });
              }
              toast.info(t.auth?.signInWithGoogle || 'Signing in with Google...');
            }}
            onAppleSignIn={() => {
              haptics.trigger('light');
              if (analytics?.track) {
                analytics.track('oauth_clicked', { provider: 'apple', action: 'signin' });
              }
              toast.info(t.auth?.signInWithApple || 'Signing in with Apple...');
            }}
            disabled={isLoading}
          />

          <div className="text-center mt-6">
            <p className="text-[14px] text-(--text-secondary)">
              {t.auth?.noAccount || "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-(--coral-primary) font-medium hover:underline focus:outline-none disabled:opacity-50"
                disabled={isLoading}
              >
                {t.auth?.signUp || 'Sign up'}
              </button>
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
