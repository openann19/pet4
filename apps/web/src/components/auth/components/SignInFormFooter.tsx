import { Button } from '@/components/ui/button';
import OAuthButtons from '../OAuthButtons';
import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import type { AppContextType } from '@/contexts/AppContext';

interface SignInFormFooterProps {
  t: AppContextType['t'];
  isLoading: boolean;
  onForgotPassword: () => void;
  onOAuthClick: (provider: 'google' | 'apple') => void;
  onSwitchToSignUp: () => void;
  onLegalClick: (type: 'terms' | 'privacy') => void;
}

export function SignInFormFooter({
  t,
  isLoading,
  onForgotPassword,
  onOAuthClick,
  onSwitchToSignUp,
  onLegalClick,
}: SignInFormFooterProps) {
  return (
    <>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => void onForgotPassword()}
          className="h-auto p-0"
        >
          {t.auth?.forgotPassword ?? 'Forgot password?'}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className={cn(
            getTypographyClasses('caption'),
            'bg-background text-muted-foreground',
            getSpacingClassesFromConfig({ paddingX: 'md' })
          )}>
            {t.auth?.or ?? 'or'}
          </span>
        </div>
      </div>

      <OAuthButtons
        onGoogleSignIn={() => onOAuthClick('google')}
        onAppleSignIn={() => onOAuthClick('apple')}
        disabled={isLoading}
      />

      <div className="text-center">
        <p className={getTypographyClasses('body-sm')}>
          <span className="text-muted-foreground">
            {t.auth?.noAccount ?? "Don't have an account?"}{' '}
          </span>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => void onSwitchToSignUp()}
            className="h-auto p-0 font-semibold"
          >
            {t.auth?.signUp ?? 'Sign up'}
          </Button>
        </p>
        <p className={getTypographyClasses('body-sm')}>
          <a
            href="https://github.com/site/terms"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onLegalClick('terms')}
            className="rounded underline text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Terms of Service"
          >
            {t.auth?.terms ?? 'Terms of Service'}
          </a>
        </p>
        <p className={getTypographyClasses('body-sm')}>
          <a
            href="https://github.com/site/privacy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onLegalClick('privacy')}
            className="rounded underline text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Privacy Policy"
          >
            {t.auth?.privacyPolicy ?? 'Privacy Policy'}
          </a>
        </p>
      </div>
    </>
  );
}

