/// <reference types="vitest" />
/// <reference types="vitest/globals" />
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = unknown>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {
    // Intentionally empty interface - extends TestingLibraryMatchers to add jest-dom matchers to Vitest
    // This is a type extension pattern, not an empty object type
  }
}
