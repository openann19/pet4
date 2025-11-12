/**
 * Resize Observer Mock Utilities
 *
 * Typed mock utilities for ResizeObserver in tests
 */

/**
 * Mock ResizeObserver class
 */
export class MockResizeObserver implements ResizeObserver {
  constructor() {
    // Mock constructor
  }

  disconnect(): void {
    // Mock disconnect
  }

  observe(): void {
    // Mock observe
  }

  unobserve(): void {
    // Mock unobserve
  }
}

/**
 * Create a mock ResizeObserver
 */
export function createMockResizeObserver(): typeof ResizeObserver {
  return MockResizeObserver as typeof ResizeObserver;
}
