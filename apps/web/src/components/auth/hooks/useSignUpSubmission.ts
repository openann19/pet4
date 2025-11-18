import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';
import { recordConsent } from '@/lib/kyc-service';
import { createLogger } from '@/lib/logger';
import type { APIError } from '@/lib/contracts';

const logger = createLogger('SignUpSubmission');

interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export function useSignUpSubmission(onSuccess: () => void) {
  const { t } = useApp();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const submitSignUp = async (data: SignUpData): Promise<void> => {
    setIsLoading(true);
    haptics.trigger('light');

    try {
      const user = await register(data.email, data.password, data.name);

      await recordConsent(user.id, 'terms', '1.0', true);
      await recordConsent(user.id, 'privacy', '1.0', true);

      analytics.track('user_signed_up', { email: data.email, method: 'email' });

      toast.success(t.auth?.signUpSuccess || 'Account created successfully!');
      haptics.trigger('success');

      onSuccess();
    } catch (_error) {
      const err = _error as APIError | Error;
      logger.error('Sign up _error', err instanceof Error ? err : new Error(err.message || 'Unknown _error'));
      const errorMessage = 'message' in err ? err.message : (err as APIError).message || t.auth?.signUpError || 'Failed to create account. Please try again.';
      toast.error(errorMessage);
      haptics.trigger('_error');
    } finally {
      setIsLoading(false);
    }
  };

  return { submitSignUp, isLoading };
}

