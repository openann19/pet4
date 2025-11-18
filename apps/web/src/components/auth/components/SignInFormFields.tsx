import { EnvelopeSimple, LockKey, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import type { AppContextType } from '@/contexts/AppContext';

interface SignInFormFieldsProps {
  email: string;
  password: string;
  showPassword: boolean;
  errors: {
    email?: string;
    password?: string;
  };
  isLoading: boolean;
  t: AppContextType['t'];
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
}

export function SignInFormFields({
  email,
  password,
  showPassword,
  errors,
  isLoading,
  t,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
}: SignInFormFieldsProps) {
  return (
    <>
      <div className={getSpacingClassesFromConfig({ spaceY: 'xs' })}>
        <Label htmlFor="email" className={cn(getTypographyClasses('body-sm'), 'font-medium')}>
          {t.auth?.email || 'Email'}
        </Label>
        <div className="relative">
          <EnvelopeSimple 
            size={20} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="email"
            type="email"
            placeholder={t.auth?.emailPlaceholder || 'you@example.com'}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className={cn('pl-10', errors.email ? 'border-destructive' : '')}
            disabled={isLoading}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-error" className={cn(getTypographyClasses('caption'), 'text-destructive')}>
            {errors.email}
          </p>
        )}
      </div>

      <div className={getSpacingClassesFromConfig({ spaceY: 'xs' })}>
        <Label htmlFor="password" className={cn(getTypographyClasses('body-sm'), 'font-medium')}>
          {t.auth?.password || 'Password'}
        </Label>
        <div className="relative">
          <LockKey 
            size={20} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t.auth?.passwordPlaceholder || '••••••••'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={cn('pl-10 pr-12', errors.password ? 'border-destructive' : '')}
            disabled={isLoading}
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isIconOnly
            onClick={() => {
              onTogglePassword();
              haptics.trigger('selection');
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
          </Button>
        </div>
        {errors.password && (
          <p id="password-error" className={cn(getTypographyClasses('caption'), 'text-destructive')}>
            {errors.password}
          </p>
        )}
      </div>
    </>
  );
}

