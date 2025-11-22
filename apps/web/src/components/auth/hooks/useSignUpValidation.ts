import { useState } from 'react';
import type { AppContextType } from '@/contexts/AppContext';

interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function useSignUpValidation(t: AppContextType['t']) {
  const [errors, setErrors] = useState<SignUpErrors>({});

  const validateForm = (data: SignUpData, agreeToTerms: boolean): boolean => {
    const newErrors: SignUpErrors = {};

    if (!data.name.trim()) {
      newErrors.name = t.auth?.nameRequired || 'Name is required';
    } else if (data.name.trim().length < 2) {
      newErrors.name = t.auth?.nameTooShort || 'Name must be at least 2 characters';
    }

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

    if (!data.confirmPassword) {
      newErrors.confirmPassword = t.auth?.confirmPasswordRequired || 'Please confirm your password';
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = t.auth?.passwordMismatch || 'Passwords do not match';
    }

    if (!agreeToTerms) {
      newErrors.terms = t.auth?.termsRequired || 'You must agree to the Terms and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field: keyof SignUpErrors) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return { errors, validateForm, clearFieldError };
}

