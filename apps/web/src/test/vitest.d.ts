/// <reference types="vitest" />
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- This interface extends TestingLibraryMatchers to add jest-dom matchers to Vitest
  interface Assertion<T = unknown>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}
