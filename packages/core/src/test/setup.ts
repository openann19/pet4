/**
 * Test setup for @petspark/core package
 * Provides common test utilities for core package tests
 */

import { afterEach, vi } from 'vitest'

// Cleanup after each test (if using any DOM-based testing)
afterEach(() => {
  vi.clearAllMocks()
})

// Set up environment variables
process.env.NODE_ENV = 'test'

// Mock console methods to avoid noise in tests (unless testing logging)
global.console = {
  ...console,
  // Uncomment if you want to suppress console logs in tests
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
}
