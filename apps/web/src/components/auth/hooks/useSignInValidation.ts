import { useState } from 'react';
import type { AppContextType } from '@/contexts/AppContext';

interface UserCredentials {
  email: string;
  password: string;
}

interface SignInErrors {
  email?: string;
  password?: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function useSignInValidation(t: AppContextType['t']) {
  const [errors, setErrors] = useState<SignInErrors>({});

  const validateForm = (data: UserCredentials): boolean => {
    const newErrors: SignInErrors = {};

    if (!data.email.trim()) {
      newErrors.email = t.auth?.emailRequired || 'Email is required';
    } else if (!validateEmail(data.email)) {
      newErrors.email = t.auth?.emailInvalid || 'Please enter a valid email';
    }

    if (!data.password) {
      newErrors.password = t.auth?.passwordRequired || 'Password is required';
    } else if (data.password.length < 6) {
      newErrors.password = t.auth?.passwordTooShort || 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field: keyof SignInErrors) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return { errors, validateForm, clearFieldError };
}

