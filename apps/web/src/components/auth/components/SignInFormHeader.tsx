import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import type { AppContextType } from '@/contexts/AppContext';

interface SignInFormHeaderProps {
  t: AppContextType['t'];
}

export function SignInFormHeader({ t }: SignInFormHeaderProps) {
  return (
    <div className={cn('text-center', getSpacingClassesFromConfig({ marginY: 'xl' }))}>
      <h2 className={cn(
        getTypographyClasses('h2'),
        'text-foreground',
        getSpacingClassesFromConfig({ marginY: 'sm' })
      )}>
        {t.auth?.signInTitle || 'Welcome Back'}
      </h2>
      <p className={cn(getTypographyClasses('body'), 'text-muted-foreground')}>
        {t.auth?.signInSubtitle || 'Sign in to continue to PawfectMatch'}
      </p>
    </div>
  );
}

