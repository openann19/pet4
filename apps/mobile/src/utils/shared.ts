/**
 * Shared utility functions for mobile app
 * Location: src/utils/shared.ts
 */

/**
 * Type guard to check if a value is truthy and not null/undefined
 * This is a TypeScript-safe replacement for JavaScript truthiness checks
 */
export function isTruthy<T>(value: T | null | undefined): value is T {
  return Boolean(value)
}

/**
 * Type guard to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Type guard to check if a string is not empty
 */
export function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Type guard to check if an array is not empty
 */
export function isNonEmptyArray<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Safe object key access with type narrowing
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  prop: K,
): obj is T & Record<K, unknown> {
  return prop in obj
}

/**
 * Safe number parsing that returns undefined for invalid numbers
 */
export function parseNumberSafe(value: string | number | null | undefined): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  
  return undefined
}

/**
 * Deep equality check for simple objects and arrays
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  
  if (a == null || b == null) return a === b
  
  if (typeof a !== typeof b) return false
  
  if (typeof a !== 'object') return false
  
  if (Array.isArray(a) !== Array.isArray(b)) return false
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }
  
  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)
  
  if (aKeys.length !== bKeys.length) return false
  
  return aKeys.every(key => deepEqual(aObj[key], bObj[key]))
}

/**
 * Clamp a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}