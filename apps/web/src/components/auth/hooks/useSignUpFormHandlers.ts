import { haptics } from '@/lib/haptics';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';
import { isTruthy } from '@petspark/shared';
import type { AppContextType } from '@/contexts/AppContext';

interface UseSignUpFormHandlersProps {
  t: AppContextType['t'];
  ageVerified: boolean;
  agreeToTerms: boolean;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  validateForm: (data: { name: string; email: string; password: string; confirmPassword: string }, agreeToTerms: boolean) => boolean;
  submitSignUp: (data: { name: string; email: string; password: string }) => Promise<void>;
  setShowAgeGate: (show: boolean) => void;
  setAgeVerified: (verified: boolean) => void;
  onSuccess: () => void;
}

export function useSignUpFormHandlers({
  t,
  ageVerified,
  agreeToTerms,
  name,
  email,
  password,
  confirmPassword,
  validateForm,
  submitSignUp,
  setShowAgeGate,
  setAgeVerified,
  onSuccess,
}: UseSignUpFormHandlersProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm({ name, email, password, confirmPassword }, agreeToTerms)) {
      haptics.trigger('error');
      return;
    }
    if (!ageVerified) {
      setShowAgeGate(true);
      return;
    }
    await submitSignUp({ name, email, password });
  };

  const handleAgeVerified = (_country?: string) => {
    setAgeVerified(true);
    setShowAgeGate(false);
    const form = document.querySelector('form');
    if (isTruthy(form)) {
      form.requestSubmit();
    }
  };

  const handleOAuthSuccess = (provider: 'google' | 'apple') => {
    haptics.trigger('light');
    analytics.track('oauth_success', { provider });
    if (!ageVerified) {
      setShowAgeGate(true);
    } else {
      void toast.success(t.auth?.signUpSuccess || 'Account created successfully!');
      onSuccess();
    }
  };

  return { handleSubmit, handleAgeVerified, handleOAuthSuccess };
}

