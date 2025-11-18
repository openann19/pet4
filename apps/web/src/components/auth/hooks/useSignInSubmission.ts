import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';
import type { APIError } from '@/lib/contracts';

const logger = createLogger('SignInSubmission');

interface SignInData {
  email: string;
  password: string;
}

export function useSignInSubmission(onSuccess: () => void) {
  const { t } = useApp();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const submitSignIn = async (data: SignInData): Promise<void> => {
    setIsLoading(true);
    haptics.trigger('light');

    try {
      await login(data.email, data.password);
      analytics.track('user_signed_in', { email: data.email, method: 'email' });
      toast.success(t.auth?.signInSuccess || 'Welcome back!');
      haptics.trigger('success');
      onSuccess();
    } catch (_error) {
      const err = _error as APIError | Error;
      logger.error('Sign in _error', err instanceof Error ? err : new Error(err.message || 'Unknown _error'));
      const errorMessage = 'message' in err ? err.message : (err as APIError).message || t.auth?.signInError || 'Failed to sign in. Please try again.';
      toast.error(errorMessage);
      haptics.trigger('_error');
    } finally {
      setIsLoading(false);
    }
  };

  return { submitSignIn, isLoading };
}

