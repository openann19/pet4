/**
 * Core utilities with strict optional handling
 * 
 * These utilities enforce exact optional semantics where applicable.
 */

import type { OptionalWithUndef } from '@/types/optional-with-undef'

/**
 * Deep merge with strict optional handling
 * 
 * Merges two objects where undefined values explicitly clear fields.
 * Omitted properties are not merged.
 * 
 * @example
 * ```ts
 * const base = { name: "John", age: 30 }
 * const update = { name: undefined, age: 31 }
 * const result = mergeWithStrictOptionals(base, update)
 * // result: { name: undefined, age: 31 }
 * ```
 */
export function mergeWithStrictOptionals<T extends Record<string, unknown>>(
  base: T,
  update: OptionalWithUndef<Partial<T>>
): T {
  const result = { ...base }

  for (const key in update) {
    if (key in update) {
      const value = update[key]
      if (value === undefined) {
        // Explicitly clear the field
        delete result[key]
      } else {
        // Update the field
        result[key] = value as T[Extract<keyof T, string>]
      }
    }
  }

  return result
}

/**
 * Check if a value is explicitly undefined (not just omitted)
 * 
 * In strict optional mode, we need to distinguish between:
 * - Property not present (omitted)
 * - Property set to undefined (explicitly cleared)
 */
export function isExplicitlyUndefined<T>(
  obj: OptionalWithUndef<Partial<T>>,
  key: keyof T
): boolean {
  return key in obj && obj[key] === undefined
}

