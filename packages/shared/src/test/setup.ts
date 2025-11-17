/**
 * Test setup for @petspark/shared package
 * Provides common test utilities and mocks for shared package tests
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

// Mock react-native-reanimated for tests
vi.mock('react-native-reanimated', () => {
  const mockSharedValue = (initial: number) => ({
    value: initial,
    get: () => initial,
    set: vi.fn(),
  })

  return {
    useSharedValue: vi.fn((initial: number) => mockSharedValue(initial)),
    useAnimatedStyle: vi.fn((fn: () => Record<string, unknown>) => {
      try {
        return fn()
      } catch {
        return {}
      }
    }),
    withSpring: vi.fn((toValue: number) => toValue),
    withTiming: vi.fn((toValue: number) => toValue),
    withRepeat: vi.fn((animation: unknown) => animation),
    withSequence: vi.fn((...args: unknown[]) => args[args.length - 1]),
    Easing: {
      linear: (t: number) => t,
      ease: (t: number) => t,
      in: (easing: (t: number) => number) => easing,
      out: (easing: (t: number) => number) => easing,
      inOut: (easing: (t: number) => number) => easing,
    },
  }
})

// Mock window.matchMedia for reduced motion tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Set up environment variables
process.env.NODE_ENV = 'test'
