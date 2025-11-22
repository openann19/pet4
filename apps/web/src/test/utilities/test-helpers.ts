/**
 * Centralized test utilities for consistent test setup and cleanup
 * Ensures all tests have proper isolation and deterministic behavior
 */

import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Reset all mocks to their initial state
 * Use this in beforeEach to ensure clean state between tests
 */
export function resetAllMocks(): void {
  vi.clearAllMocks();
  vi.restoreAllMocks();
}

/**
 * Clean up test state including timers, storage, and event listeners
 * Use this in afterEach to ensure no state leaks between tests
 */
export function cleanupTestState(): void {
  // Restore real timers if fake timers were used
  if (vi.isFakeTimers()) {
    vi.useRealTimers();
  }

  // Clear all timers
  vi.clearAllTimers();

  // Cleanup React Testing Library
  cleanup();

  // Clear storage mocks
  if (typeof window !== 'undefined') {
    if (window.localStorage) {
      window.localStorage.clear();
    }
    if (window.sessionStorage) {
      window.sessionStorage.clear();
    }
  }

  // Clear any global event listeners
  // Note: This is a best-effort cleanup as we can't track all listeners
  // Individual tests should clean up their own listeners
}

/**
 * Setup standard test environment
 * Use this in beforeEach for consistent test setup
 *
 * By default, uses fake timers for deterministic test execution.
 * Tests can opt out by calling vi.useRealTimers() if needed.
 */
export function setupTestEnvironment(): void {
  resetAllMocks();

  // Use fake timers by default for deterministic tests
  // This ensures all timers (setTimeout, setInterval, etc.) are controlled
  // Tests can opt out by calling vi.useRealTimers() if needed
  if (!vi.isFakeTimers()) {
    vi.useFakeTimers();
  }
}

/**
 * Teardown test environment
 * Use this in afterEach for consistent test cleanup
 */
export function teardownTestEnvironment(): void {
  cleanupTestState();
}

/**
 * Isolate global state by saving current state
 * Returns a function to restore the saved state
 */
export function isolateGlobalState(): () => void {
  const savedState: Record<string, unknown> = {};

  // Save common global state
  if (typeof window !== 'undefined') {
    savedState.localStorage = JSON.stringify(window.localStorage);
    savedState.sessionStorage = JSON.stringify(window.sessionStorage);
  }

  // Return restore function
  return () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = savedState.localStorage;
        if (saved && typeof saved === 'string') {
          const parsed = JSON.parse(saved);
          window.localStorage.clear();
          Object.keys(parsed).forEach((key) => {
            window.localStorage.setItem(key, parsed[key] as string);
          });
        }
      } catch {
        // Ignore restore errors
      }
    }
  };
}

/**
 * Create a mock singleton instance
 * Useful for mocking singleton services that maintain state
 */
export function mockSingleton<T extends Record<string, unknown>>(
  factory: () => T
): T {
  const instance = factory();

  // Reset all methods to be mocks
  Object.keys(instance).forEach((key) => {
    const value = instance[key as keyof T];
    if (typeof value === 'function') {
      // Use type assertion to handle generic type indexing
      (instance as Record<string, unknown>)[key] = vi.fn(value as (...args: unknown[]) => unknown);
    }
  });

  return instance;
}

/**
 * Wait for all pending promises to resolve
 * Useful for tests with async operations
 */
export async function waitForAllPromises(): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Advance timers and wait for promises
 * Combines timer advancement with promise resolution
 */
export async function advanceTimersAndPromises(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms);
  await waitForAllPromises();
}
