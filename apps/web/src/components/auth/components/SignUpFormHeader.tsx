import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import type { AppContextType } from '@/contexts/AppContext';

interface SignUpFormHeaderProps {
  t: AppContextType['t'];
}

export function SignUpFormHeader({ t }: SignUpFormHeaderProps) {
  return (
    <div className={cn('text-center', getSpacingClassesFromConfig({ marginY: 'xl' }))}>
      <h2 className={cn(
        getTypographyClasses('h2'),
        'text-foreground',
        getSpacingClassesFromConfig({ marginY: 'sm' })
      )}>
        {t.auth?.signUpTitle || 'Create Account'}
      </h2>
      <p className={cn(
        getTypographyClasses('body'),
        'text-muted-foreground'
      )}>
        {t.auth?.signUpSubtitle || 'Join PawfectMatch to find your pet\'s perfect companion'}
      </p>
    </div>
  );
}

