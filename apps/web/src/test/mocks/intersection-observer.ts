/**
 * Intersection Observer Mock Utilities
 *
 * Typed mock utilities for IntersectionObserver in tests
 */

/**
 * Mock IntersectionObserver class
 */
export class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin = '';
  thresholds: readonly number[] = [];

  constructor() {
    // Mock constructor
  }

  disconnect(): void {
    // Mock disconnect
  }

  observe(): void {
    // Mock observe
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(): void {
    // Mock unobserve
  }
}

/**
 * Create a mock IntersectionObserver
 */
export function createMockIntersectionObserver(): typeof IntersectionObserver {
  return MockIntersectionObserver as typeof IntersectionObserver;
}
