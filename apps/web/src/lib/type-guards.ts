/**
 * Type Guard Utilities
 *
 * Runtime validation functions for type safety
 * Use these to validate API responses and objects before accessing properties
 */

/**
 * Type guard to check if a value is a valid object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, unknown> {
  return isObject(value) && key in value;
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Type guard to check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to validate API response structure
 */
export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  headers?: Record<string, string>;
}

export function isValidAPIResponse<T = unknown>(value: unknown): value is APIResponse<T> {
  if (!isObject(value)) return false;
  if (!hasProperty(value, 'data')) return false;
  if (!hasProperty(value, 'status') || !isNumber(value.status)) return false;
  return true;
}

/**
 * Type guard to validate user object structure
 */
export interface User {
  id: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export function isValidUser(value: unknown): value is User {
  if (!isObject(value)) return false;
  if (!hasProperty(value, 'id') || !isString(value.id)) return false;
  return true;
}

/**
 * Type guard to validate pet object structure
 */
export interface Pet {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export function isValidPet(value: unknown): value is Pet {
  if (!isObject(value)) return false;
  if (!hasProperty(value, 'id') || !isString(value.id)) return false;
  return true;
}

/**
 * Type guard to check if value is not null or undefined
 */
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to validate error object
 */
export interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
}

export function isErrorWithStatus(value: unknown): value is ErrorWithStatus {
  return value instanceof Error && (
    'status' in value || 'code' in value
  );
}
