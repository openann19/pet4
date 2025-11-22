import { useState } from 'react';
import type { AppContextType } from '@/contexts/AppContext';
import { useSignUpValidation } from './useSignUpValidation';
import { useSignUpSubmission } from './useSignUpSubmission';

export function useSignUpFormState(
  t: AppContextType['t'],
  onSuccess: () => void
) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);

  const { errors, validateForm, clearFieldError } = useSignUpValidation(t);
  const { submitSignUp, isLoading } = useSignUpSubmission(onSuccess);

  const formFieldHandlers = {
    onNameChange: (value: string) => {
      setName(value);
      clearFieldError('name');
    },
    onEmailChange: (value: string) => {
      setEmail(value);
      clearFieldError('email');
    },
    onPasswordChange: (value: string) => {
      setPassword(value);
      clearFieldError('password');
    },
    onConfirmPasswordChange: (value: string) => {
      setConfirmPassword(value);
      clearFieldError('confirmPassword');
    },
    onTogglePassword: () => setShowPassword(!showPassword),
    onToggleConfirmPassword: () => setShowConfirmPassword(!showConfirmPassword),
    onTermsChange: (checked: boolean) => {
      setAgreeToTerms(checked);
      clearFieldError('terms');
    },
  };

  return {
    name,
    email,
    password,
    confirmPassword,
    showPassword,
    showConfirmPassword,
    agreeToTerms,
    showAgeGate,
    ageVerified,
    errors,
    isLoading,
    validateForm,
    submitSignUp,
    formFieldHandlers,
    setShowAgeGate,
    setAgeVerified,
  };
}

