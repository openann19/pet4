import { useState } from 'react';
import type { AppContextType } from '@/contexts/AppContext';
import { useSignInValidation } from './useSignInValidation';
import { useSignInSubmission } from './useSignInSubmission';

export function useSignInFormState(
  t: AppContextType['t'],
  onSuccess: () => void
) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { errors, validateForm, clearFieldError } = useSignInValidation(t);
  const { submitSignIn, isLoading } = useSignInSubmission(onSuccess);

  const formFieldHandlers = {
    onEmailChange: (value: string) => {
      setEmail(value);
      clearFieldError('email');
    },
    onPasswordChange: (value: string) => {
      setPassword(value);
      clearFieldError('password');
    },
    onTogglePassword: () => setShowPassword(!showPassword),
  };

  return {
    email,
    password,
    showPassword,
    errors,
    isLoading,
    validateForm,
    submitSignIn,
    formFieldHandlers,
  };
}

