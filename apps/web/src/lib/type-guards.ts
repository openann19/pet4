/**
 * Type Guards and Type Utilities
 *
 * Utilities for type-safe runtime checks and unknown type handling
 */

/**
 * Check if value is a valid string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a valid number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a valid boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if value is a valid object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type-safe property access
 */
export function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

/**
 * Get property with type guard
 */
export function getProperty<T>(
  obj: unknown,
  key: string,
  guard: (value: unknown) => value is T
): T | undefined {
  if (hasProperty(obj, key)) {
    const value = obj[key];
    if (guard(value)) {
      return value;
    }
  }
  return undefined;
}

/**
 * Window with feature flags extension
 */
export interface WindowWithFeatureFlags extends Window {
  __FEATURE_FLAGS__?: Partial<Record<string, boolean | string | number>>;
}

/**
 * Type guard for window with feature flags
 */
export function hasFeatureFlags(window: Window): window is WindowWithFeatureFlags {
  return '__FEATURE_FLAGS__' in window;
}

/**
 * Screen with refresh rate extension
 */
export interface ScreenWithRefreshRate extends Screen {
  refreshRate?: number;
}

/**
 * Type guard for screen with refresh rate
 */
export function hasRefreshRate(screen: Screen): screen is ScreenWithRefreshRate {
  return 'refreshRate' in screen;
}
