/// <reference types="vitest" />
/// <reference types="vitest/globals" />
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// Type augmentation to add jest-dom matchers to Vitest Assertion interface
// Using interface declaration with a marker property to satisfy linter
declare module 'vitest' {
  interface Assertion<T = unknown>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {
    // Marker property to satisfy TypeScript linter (no-empty-object-type rule)
    // All actual matchers are inherited from TestingLibraryMatchers
    readonly __jestDomMatchers: never;
  }
}
