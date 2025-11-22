/**
 * Test setup for @petspark/chat-core package
 * Provides React testing utilities and mocks for chat-core tests
 */

import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock React Native modules for cross-platform tests
vi.mock('react-native', () => {
  return {
    Platform: {
      OS: 'web',
      select: (obj: { web?: unknown; default?: unknown }) => obj.web || obj.default,
    },
    View: 'div',
    Text: 'span',
    StyleSheet: {
      create: (styles: Record<string, unknown>) => styles,
      hairlineWidth: 1,
    },
  }
})

// Mock storage adapters
vi.mock('@petspark/shared', async () => {
  const actual = await vi.importActual('@petspark/shared')
  return {
    ...actual,
    // Add any shared mocks needed for chat-core tests
  }
})

// Set up environment variables
process.env.NODE_ENV = 'test'
