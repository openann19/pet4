/**
 * Optional Import Utilities
 *
 * Type-safe utilities for importing optional dependencies
 * Replaces require() calls with proper dynamic imports
 */

/**
 * Type guard function type
 */
export type TypeGuard<T> = (module: unknown) => module is T

/**
 * Import an optional module with type safety
 *
 * @param modulePath - Path to the module to import
 * @param typeGuard - Optional type guard function to validate the module
 * @returns The imported module or null if import fails or type guard fails
 *
 * @example
 * ```typescript
 * const haptics = await importOptional<ExpoHaptics>('expo-haptics', (m): m is ExpoHaptics => {
 *   return typeof m === 'object' && m !== null && 'selectionAsync' in m
 * })
 * ```
 */
export async function importOptional<T>(
  modulePath: string,
  typeGuard?: TypeGuard<T>
): Promise<T | null> {
  try {
    const module = await import(modulePath)
    const defaultExport = (module.default ?? module) as unknown

    if (typeGuard) {
      return typeGuard(defaultExport) ? defaultExport : null
    }

    return defaultExport as T
  } catch {
    return null
  }
}

/**
 * Synchronously check if a module is available (for initialization)
 * Note: This is a build-time check and may not work in all environments
 * For runtime checks, use importOptional instead
 */
export function isModuleAvailable(): boolean {
  // In React Native/Expo environments, we cannot use require.resolve at runtime
  // This function is primarily for build-time checks
  // For runtime checks, use importOptional which handles errors gracefully
  return false
}
