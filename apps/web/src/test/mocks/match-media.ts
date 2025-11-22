/**
 * Match Media Mock Utilities
 *
 * Typed mock utilities for MediaQueryList in tests
 */

import { vi } from 'vitest';

/**
 * Create a mock MediaQueryList
 *
 * @param matches - Whether the media query matches
 * @returns Mock MediaQueryList object
 */
export function createMockMatchMedia(matches = false): MediaQueryList {
  return {
    media: '',
    matches,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as MediaQueryList;
}
