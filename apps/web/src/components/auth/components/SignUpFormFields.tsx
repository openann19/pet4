import { User, EnvelopeSimple, LockKey, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import type { AppContextType } from '@/contexts/AppContext';

interface SignUpFormFieldsProps {
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
  t: AppContextType['t'];
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onTermsChange: (checked: boolean) => void;
}

export function SignUpFormFields({
  name,
  email,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  agreeToTerms,
  errors,
  isLoading,
  t,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onTermsChange,
}: SignUpFormFieldsProps) {
  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="name" className="block text-sm font-medium mb-1 text-foreground">
          {t.auth?.name || 'Full Name'}
        </Label>
        <div className="relative">
          <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder={t.auth?.namePlaceholder || 'John Doe'}
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
            className={cn('h-12 pl-10', errors.name ? 'border-destructive' : '')}
            disabled={isLoading}
            autoComplete="name"
          />
        </div>
        {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email" className="block text-sm font-medium mb-1 text-foreground">
          {t.auth?.email || 'Email'}
        </Label>
        <div className="relative">
          <EnvelopeSimple size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder={t.auth?.emailPlaceholder || 'you@example.com'}
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEmailChange(e.target.value)}
            className={cn('h-12 pl-10', errors.email ? 'border-destructive' : '')}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
        {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password" className="block text-sm font-medium mb-1 text-foreground">
          {t.auth?.password || 'Password'}
        </Label>
        <div className="relative">
          <LockKey size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={t.auth?.passwordPlaceholder || '••••••••'}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPasswordChange(e.target.value)}
            className={cn('h-12 pl-10 pr-12', errors.password ? 'border-destructive' : '')}
            disabled={isLoading}
            autoComplete="new-password"
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
        {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-foreground">
          {t.auth?.confirmPassword || 'Confirm Password'}
        </Label>
        <div className="relative">
          <LockKey size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t.auth?.confirmPasswordPlaceholder || '••••••••'}
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onConfirmPasswordChange(e.target.value)}
            className={cn('h-12 pl-10 pr-12', errors.confirmPassword ? 'border-destructive' : '')}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isIconOnly
            onClick={() => {
              onToggleConfirmPassword();
              haptics.trigger('selection');
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
          </Button>
        </div>
        {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={agreeToTerms}
            onCheckedChange={(checked) => {
              onTermsChange(checked === true);
              haptics.trigger('selection');
            }}
            disabled={isLoading}
            className={errors.terms ? 'border-red-500' : ''}
          />
          <label htmlFor="terms" className="cursor-pointer text-sm text-muted-foreground leading-tight">
            {t.auth?.agreeToTerms || 'I agree to the'}{' '}
            <a
              href="https://github.com/site/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); }}
            >
              {t.auth?.terms || 'Terms of Service'}
            </a>
            {' '}{t.auth?.and || 'and'}{' '}
            <a
              href="https://github.com/site/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); }}
            >
              {t.auth?.privacyPolicy || 'Privacy Policy'}
            </a>
          </label>
        </div>
        {errors.terms && <p className="mt-1 text-sm text-destructive">{errors.terms}</p>}
      </div>
    </>
  );
}

