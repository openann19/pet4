/**
 * Runtime Safety Utilities
 * Provides defensive data handling, validation, and safe access patterns
 */

import { z } from 'zod';

/**
 * Safe array access with guard
 * Returns the element at index or undefined if out of bounds
 */
export function safeArrayAccess<T>(array: T[] | undefined | null, index: number): T | undefined {
  if (!array || !Array.isArray(array)) {
    return undefined;
  }
  if (index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
}

/**
 * Safe array access with default value
 * Returns the element at index or defaultValue if out of bounds
 */
export function safeArrayAccessWithDefault<T>(
  array: T[] | undefined | null,
  index: number,
  defaultValue: T
): T {
  const value = safeArrayAccess(array, index);
  return value ?? defaultValue;
}

/**
 * Validate data with Zod schema, returning safe defaults on failure
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaultValue: T
): T {
  try {
    return schema.parse(data);
  } catch {
    return defaultValue;
  }
}

/**
 * Validate data with Zod schema, returning undefined on failure
 */
export function tryValidateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | undefined {
  try {
    return schema.parse(data);
  } catch {
    return undefined;
  }
}

/**
 * Safe object property access
 * Returns the property value or undefined if not found
 */
export function safePropertyAccess<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K
): T[K] | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  return obj[key];
}

/**
 * Guard function to check if value exists
 */
export function exists<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Guard function to check if array is non-empty
 */
export function isNonEmptyArray<T>(value: T[] | undefined | null): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Safe async operation wrapper
 * Returns [result, error] tuple
 */
export async function safeAsync<T>(
  operation: () => Promise<T>
): Promise<[T | undefined, Error | undefined]> {
  try {
    const result = await operation();
    return [result, undefined];
  } catch (error) {
    return [undefined, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Safe sync operation wrapper
 * Returns [result, error] tuple
 */
export function safeSync<T>(operation: () => T): [T | undefined, Error | undefined] {
  try {
    const result = operation();
    return [result, undefined];
  } catch (error) {
    return [undefined, error instanceof Error ? error : new Error(String(error))];
  }
}

/**
 * Common Zod schemas for runtime validation
 */
export const commonSchemas = {
  string: z.string(),
  number: z.number(),
  boolean: z.boolean(),
  stringArray: z.array(z.string()),
  numberArray: z.array(z.number()),
  id: z.string().min(1),
  optionalId: z.string().min(1).optional(),
  email: z.string().email(),
  url: z.string().url(),
} as const;

