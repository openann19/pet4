import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EnvelopeSimple, LockKey, User, Eye, EyeSlash } from '@phosphor-icons/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { haptics } from '@/lib/haptics';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';
import OAuthButtons from './OAuthButtons';
import AgeGateModal from './AgeGateModal';
import { recordConsent } from '@/lib/kyc-service';
import { createLogger } from '@/lib/logger';
import type { APIError } from '@/lib/contracts';

const logger = createLogger('SignUpForm');

interface SignUpFormProps {
  onSuccess: () => void;
  onSwitchToSignIn: () => void;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export default function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps): JSX.Element {
  const { t } = useApp();
  const { register } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  // Localized Zod schema ensures fallback messages work when translation keys are missing
  const signUpSchema = z
    .object({
      name: z.string().min(1, t.auth?.nameRequired ?? 'Name is required').min(2, t.auth?.nameTooShort ?? 'Name too short'),
      email: z.string().min(1, t.auth?.emailRequired ?? 'Email is required').email(t.auth?.emailInvalid ?? 'Invalid email'),
      password: z.string().min(1, t.auth?.passwordRequired ?? 'Password is required').min(6, t.auth?.passwordTooShort ?? 'Password must be at least 6 characters'),
      confirmPassword: z.string().min(1, t.auth?.confirmPasswordRequired ?? 'Please confirm your password'),
      agreeToTerms: z.boolean().refine((val) => val === true, { message: t.auth?.termsRequired ?? 'You must accept the terms' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.auth?.passwordMismatch ?? 'Passwords do not match',
      path: ['confirmPassword'],
    });

  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', agreeToTerms: false },
    mode: 'onChange',
  });

  const onSubmit = useCallback(async (data: SignUpData) => {
    if (!ageVerified) {
      setShowAgeGate(true);
      return;
    }

    setIsLoading(true);
    haptics.trigger('light');

    try {
      const user = await register(data.email, data.password, data.name);

      try {
        await Promise.all([
          recordConsent(user.id, 'terms', '1.0', true),
          recordConsent(user.id, 'privacy', '1.0', true),
        ]);
      } catch (consentErr) {
        logger.warn('Consent record failed', consentErr);
      }

      if (analytics?.track) {
        analytics.track('user_signed_up', { email: data.email, method: 'email' });
      }
      toast.success(t.auth?.signUpSuccess ?? 'Welcome aboard!');
      haptics.trigger('success');
      onSuccess();
    } catch (error) {
      const err = error as APIError | Error;
      logger.error('Sign up error', err instanceof Error ? err : new Error(err.message || 'Unknown error'));

      const message =
        'message' in err
          ? err.message
          : (err as APIError).message || t.auth?.signUpError || 'Failed to sign up. Please try again.';

      toast.error(message);
      haptics.trigger('error');
    } finally {
      setIsLoading(false);
    }
  }, [ageVerified, register, t.auth, onSuccess]);

  const handleAgeVerified = useCallback(
    (country?: string) => {
      setAgeVerified(true);
      setShowAgeGate(false);
      haptics.trigger('success');
      if (analytics?.track) {
        analytics.track('age_verified', { country: country ?? 'unknown' });
      }

      if (form.formState.isValid && formRef.current) {
        formRef.current.requestSubmit();
      } else if (form.formState.isValid) {
        void form.handleSubmit(onSubmit)();
      } else {
        logger.info('Age verified, waiting for form completion', { email: form.getValues('email') });
      }
    },
    [form, onSubmit],
  );

  const handleOAuthSuccess = useCallback(
    (provider: 'google' | 'apple') => {
      try {
        haptics.trigger('light');
        if (analytics?.track) {
          analytics.track('oauth_success', { provider });
        }

        if (!ageVerified) {
          setShowAgeGate(true);
          return;
        }

        toast.success(t.auth?.signUpSuccess ?? 'Account created');
        haptics.trigger('success');
        onSuccess();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('OAuth error', err, { provider });
        toast.error(t.auth?.signUpError ?? 'OAuth sign-up failed');
        haptics.trigger('error');
      }
    },
    [ageVerified, onSuccess, t.auth],
  );

  return (
    <div className="w-full bg-white rounded-3xl p-8 sm:p-12">
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-end mb-6">
          <div className="bg-black rounded-full px-3 py-1 flex items-center gap-1.5">
            <Spinner size="sm" className="w-3 h-3" />
            <span className="text-white text-xs font-medium">Loading</span>
          </div>
        </div>
      )}

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[32px] font-bold text-gray-900 mb-3 tracking-tight">Create Account</h1>
          <p className="text-gray-500 text-[15px]">Join PawfectMatch to find your pet's perfect companion</p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-5"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-700 mb-2 block">Full Name</FormLabel>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" weight="regular" />
                    <input
                      {...field}
                      type="text"
                      placeholder="John Doe"
                      className="w-full h-[50px] pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                      autoComplete="name"
                      aria-label="Full Name"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-700 mb-2 block">Email</FormLabel>
                  <div className="relative">
                    <EnvelopeSimple size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" weight="regular" />
                    <input
                      {...field}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full h-[50px] pl-12 pr-4 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                      autoComplete="email"
                      aria-label="Email address"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-700 mb-2 block">Password</FormLabel>
                  <div className="relative">
                    <LockKey size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" weight="regular" />
                    <input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full h-[50px] pl-12 pr-12 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                      autoComplete="new-password"
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword((p) => !p);
                        haptics.trigger('selection');
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-gray-700 mb-2 block">Confirm Password</FormLabel>
                  <div className="relative">
                    <LockKey size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" weight="regular" />
                    <input
                      {...field}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full h-[50px] pl-12 pr-12 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                      autoComplete="new-password"
                      aria-label="Confirm Password"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfirmPassword((p) => !p);
                        haptics.trigger('selection');
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeSlash size={18} weight="regular" /> : <Eye size={18} weight="regular" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3 pt-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === true);
                          haptics.trigger('selection');
                        }}
                        disabled={isLoading}
                        className="mt-0.5 rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel className="text-[13px] text-gray-600 leading-relaxed cursor-pointer font-normal">
                      I agree to the{' '}
                      <a
                        href="https://pawfectmatch.app/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4A90E2] hover:underline"
                      >
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a
                        href="https://pawfectmatch.app/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4A90E2] hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] bg-[#FF8B7B] hover:bg-[#FF7A68] active:bg-[#FF6957] text-white text-[15px] font-semibold rounded-xl transition-colors mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[13px]">
                <span className="px-3 bg-white text-gray-500">or</span>
              </div>
            </div>

            <OAuthButtons
              onGoogleSignIn={() => handleOAuthSuccess('google')}
              onAppleSignIn={() => handleOAuthSuccess('apple')}
              disabled={isLoading}
            />
          </form>
        </Form>

        {/* Sign in link */}
        <div className="text-center mt-6">
          <p className="text-[14px] text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignIn}
              disabled={isLoading}
              className="text-[#4A90E2] font-medium hover:underline focus:outline-none disabled:opacity-50"
            >
              Sign in
            </button>
          </p>
        </div>

      <AgeGateModal open={showAgeGate} onVerified={handleAgeVerified} onClose={() => setShowAgeGate(false)} />
    </div>
  );
}
