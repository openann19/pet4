import { haptics } from '@/lib/haptics';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';
import type { AppContextType } from '@/contexts/AppContext';

interface UseSignInFormHandlersProps {
  t: AppContextType['t'];
  email: string;
  password: string;
  validateForm: (data: { email: string; password: string }) => boolean;
  submitSignIn: (data: { email: string; password: string }) => Promise<void>;
}

export function useSignInFormHandlers({
  t,
  email,
  password,
  validateForm,
  submitSignIn,
}: UseSignInFormHandlersProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm({ email, password })) {
      haptics.trigger('error');
      return;
    }
    await submitSignIn({ email, password });
  };

  const handleForgotPassword = () => {
    haptics.trigger('selection');
    analytics.track('forgot_password_clicked');
    void toast.info(t.auth?.forgotPasswordInfo || 'Password reset link would be sent to your email');
  };

  const handleLegalClick = (type: 'terms' | 'privacy') => {
    analytics.track(`sign_in_${String(type)}`);
  };

  const handleOAuthClick = (provider: 'google' | 'apple') => {
    haptics.trigger('light');
    analytics.track('oauth_clicked', { provider, action: 'signin' });
    const message = provider === 'google' 
      ? (t.auth?.signInWithGoogle || 'Signing in with Google...')
      : (t.auth?.signInWithApple || 'Signing in with Apple...');
    void toast.info(message);
  };

  return { handleSubmit, handleForgotPassword, handleLegalClick, handleOAuthClick };
}

