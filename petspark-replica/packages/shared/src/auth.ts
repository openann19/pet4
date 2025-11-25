/**
 * Auth validation utilities for web/mobile parity
 *
 * Provides reusable validation logic for authentication forms
 * with proper error handling and type safety
 */

import type { UserCredentials, SignUpCredentials, AuthValidationResult, AuthValidationError } from './types';
import { isValidEmail, isValidUsername } from './utils';

/**
 * Validates password requirements (8 characters minimum for signUp)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

/**
 * Validates user credentials and returns detailed validation result
 */
export function validateCredentials(credentials: UserCredentials): AuthValidationResult {
  const errors: AuthValidationError[] = [];

  // Email validation
  if (!credentials.email.trim()) {
    errors.push({
      field: 'email',
      message: AUTH_MESSAGES.EMAIL_REQUIRED
    });
  } else if (!isValidEmail(credentials.email)) {
    errors.push({
      field: 'email',
      message: AUTH_MESSAGES.EMAIL_INVALID
    });
  }

  // Password validation
  if (!credentials.password.trim()) {
    errors.push({
      field: 'password',
      message: AUTH_MESSAGES.PASSWORD_REQUIRED
    });
  } else if (!isValidPassword(credentials.password)) {
    errors.push({
      field: 'password',
      message: AUTH_MESSAGES.PASSWORD_TOO_SHORT
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates sign up credentials and returns detailed validation result
 */
export function validateSignUpCredentials(credentials: SignUpCredentials): AuthValidationResult {
  const errors: AuthValidationError[] = [];

  // Email validation
  if (!credentials.email.trim()) {
    errors.push({
      field: 'email',
      message: AUTH_MESSAGES.EMAIL_REQUIRED
    });
  } else if (!isValidEmail(credentials.email)) {
    errors.push({
      field: 'email',
      message: AUTH_MESSAGES.EMAIL_INVALID
    });
  }

  // Display name validation
  if (!credentials.displayName.trim()) {
    errors.push({
      field: 'displayName',
      message: AUTH_MESSAGES.DISPLAY_NAME_REQUIRED
    });
  } else if (credentials.displayName.length < 1 || credentials.displayName.length > 50) {
    errors.push({
      field: 'displayName',
      message: AUTH_MESSAGES.DISPLAY_NAME_INVALID
    });
  }

  // Username validation
  if (!credentials.username.trim()) {
    errors.push({
      field: 'username',
      message: AUTH_MESSAGES.USERNAME_REQUIRED
    });
  } else if (!isValidUsername(credentials.username)) {
    errors.push({
      field: 'username',
      message: AUTH_MESSAGES.USERNAME_INVALID
    });
  }

  // Password validation
  if (!credentials.password.trim()) {
    errors.push({
      field: 'password',
      message: AUTH_MESSAGES.PASSWORD_REQUIRED
    });
  } else if (!isValidPassword(credentials.password)) {
    errors.push({
      field: 'password',
      message: AUTH_MESSAGES.PASSWORD_TOO_SHORT
    });
  }

  // Confirm password validation
  if (!credentials.confirmPassword.trim()) {
    errors.push({
      field: 'confirmPassword',
      message: AUTH_MESSAGES.CONFIRM_PASSWORD_REQUIRED
    });
  } else if (credentials.password !== credentials.confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: AUTH_MESSAGES.PASSWORD_MISMATCH
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets error message for a specific field
 */
export function getFieldError(errors: readonly AuthValidationError[], field: 'email' | 'password' | 'confirmPassword' | 'displayName' | 'username'): string | undefined {
  return errors.find(error => error.field === field)?.message;
}

/**
 * Auth error messages for consistent user experience
 */
export const AUTH_MESSAGES = {
  // Validation errors
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  DISPLAY_NAME_REQUIRED: 'Display name is required',
  DISPLAY_NAME_INVALID: 'Display name must be 1-50 characters',
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_INVALID: 'Username must be 3-20 characters (letters, numbers, underscore)',
  CONFIRM_PASSWORD_REQUIRED: 'Please confirm your password',
  PASSWORD_MISMATCH: 'Passwords do not match',

  // Authentication results
  SIGN_IN_SUCCESS: 'Welcome back!',
  SIGN_IN_ERROR: 'Failed to sign in. Please try again.',
  SIGN_UP_SUCCESS: 'Account created successfully!',
  SIGN_UP_ERROR: 'Unable to create your account. Please try again.',

  // Password reset
  FORGOT_PASSWORD_INFO: 'Password reset link sent to your email',
  FORGOT_PASSWORD_ERROR: 'Failed to send reset link. Please try again.',

  // UI text
  SIGN_IN_TITLE: 'Welcome Back',
  SIGN_IN_SUBTITLE: 'Sign in to continue to PETSPARK',
  SIGN_UP_TITLE: 'Create Account',
  SIGN_UP_SUBTITLE: 'Join PETSPARK and connect with pet lovers',

  // Form labels
  EMAIL: 'Email',
  EMAIL_PLACEHOLDER: 'you@example.com',
  PASSWORD: 'Password',
  PASSWORD_PLACEHOLDER: 'Enter a strong password',
  CONFIRM_PASSWORD: 'Confirm Password',
  CONFIRM_PASSWORD_PLACEHOLDER: 'Repeat your password',
  DISPLAY_NAME: 'Display Name',
  DISPLAY_NAME_PLACEHOLDER: 'Enter your display name',
  USERNAME: 'Username',
  USERNAME_PLACEHOLDER: 'Choose a username',
  FORGOT_PASSWORD: 'Forgot password?',
  SIGN_IN: 'Sign In',
  SIGN_UP: 'Sign Up',
  CREATE_ACCOUNT: 'Create Account',
  NO_ACCOUNT: "Don't have an account?",
  HAVE_ACCOUNT: 'Already have an account?',
  OR: 'or',
} as const;
