/**
 * Error handling utilities for consistent error normalization and type guards.
 * Provides type-safe error handling across the codebase.
 */

/**
 * Type guard to check if a value is an Error instance.
 *
 * @param error - The value to check
 * @returns True if the value is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Normalizes an unknown error value to an Error instance.
 * If the value is already an Error, returns it. Otherwise, creates a new Error
 * with a string representation of the value.
 *
 * @param error - The error value to normalize
 * @returns An Error instance
 */
export function normalizeError(error: unknown): Error {
  if (isError(error)) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error === null || error === undefined) {
    return new Error('Unknown error');
  }

  try {
    return new Error(String(error));
  } catch {
    return new Error('Failed to convert error to string');
  }
}

/**
 * Extracts error message from an unknown error value.
 *
 * @param error - The error value
 * @returns The error message string
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error === null || error === undefined) {
    return 'Unknown error';
  }

  try {
    return String(error);
  } catch {
    return 'Failed to convert error to string';
  }
}

