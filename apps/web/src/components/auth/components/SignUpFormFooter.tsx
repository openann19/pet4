import { Button } from '@/components/ui/button';
import OAuthButtons from '../OAuthButtons';
import { getTypographyClasses } from '@/lib/typography';
import type { AppContextType } from '@/contexts/AppContext';

interface SignUpFormFooterProps {
  t: AppContextType['t'];
  isLoading: boolean;
  onOAuthSuccess: (provider: 'google' | 'apple') => void;
  onSwitchToSignIn: () => void;
}

export function SignUpFormFooter({ t, isLoading, onOAuthSuccess, onSwitchToSignIn }: SignUpFormFooterProps) {
  return (
    <>
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
        onGoogleSignIn={() => { onOAuthSuccess('google') }}
        onAppleSignIn={() => { onOAuthSuccess('apple') }}
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
    </>
  );
}

