import { Button } from '@/components/ui/button';
import { SignUpFormFields } from './SignUpFormFields';
import { SignUpFormFooter } from './SignUpFormFooter';
import { getSpacingClassesFromConfig } from '@/lib/typography';
import { haptics } from '@/lib/haptics';
import type { AppContextType } from '@/contexts/AppContext';

interface SignUpFormBodyProps {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  agreeToTerms: boolean;
  errors: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  };
  isLoading: boolean;
  shouldReduceMotion: boolean;
  t: AppContextType['t'];
  formFieldHandlers: {
    onNameChange: (value: string) => void;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onTogglePassword: () => void;
    onToggleConfirmPassword: () => void;
    onTermsChange: (checked: boolean) => void;
  };
  onOAuthSuccess: (provider: 'google' | 'apple') => void;
  onSwitchToSignIn: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function SignUpFormBody({
  name,
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  agreeToTerms,
  errors,
  isLoading,
  shouldReduceMotion,
  t,
  formFieldHandlers,
  onOAuthSuccess,
  onSwitchToSignIn,
  onSubmit,
}: SignUpFormBodyProps) {
  return (
    <form onSubmit={(e) => void onSubmit(e)} className={getSpacingClassesFromConfig({ spaceY: 'lg' })}>
      <SignUpFormFields
        name={name}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        agreeToTerms={agreeToTerms}
        errors={errors}
        isLoading={isLoading}
        t={t}
        {...formFieldHandlers}
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isLoading}
        className="w-full rounded-xl"
        onMouseEnter={() => !shouldReduceMotion && haptics.trigger('selection')}
      >
        {isLoading ? (t.common.loading || 'Loading...') : (t.auth?.createAccount || 'Create Account')}
      </Button>
      <SignUpFormFooter
        t={t}
        isLoading={isLoading}
        onOAuthSuccess={onOAuthSuccess}
        onSwitchToSignIn={onSwitchToSignIn}
      />
    </form>
  );
}

