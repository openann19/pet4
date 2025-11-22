import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function generateULID(): string {
  const timestamp = Date.now();
  const randomness = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  ).join('');
  return `${timestamp.toString(36)}${randomness}`.toUpperCase();
}

/**
 * Type guard for truthy values
 */
export function isTruthy<T>(value: T | null | undefined): value is T {
  return Boolean(value)
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred'
}

/**
 * Normalize error to a safe object with message and optional stack
 * Use this when you need to access error.message or error.stack safely
 */
export function toErrorLike(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    const result: { message: string; stack?: string } = { message: err.message };
    if (err.stack) {
      result.stack = err.stack;
    }
    return result;
  }
  if (typeof err === 'string') {
    return { message: err };
  }
  return { message: JSON.stringify(err) };
}

/**
 * Check if running in browser
 */
export const isBrowser = typeof window !== 'undefined'

/**
 * Check if running in development
 */
export const isDev = process.env.NODE_ENV === 'development'
