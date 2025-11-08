/**
 * Test setup for @petspark/motion package
 */

import { vi } from 'vitest'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: (initialValue: unknown) => ({
      value: initialValue,
    }),
    useAnimatedStyle: (updater: () => unknown) => updater(),
    withSpring: (toValue: number, config?: unknown) => toValue,
    withTiming: (toValue: number, config?: unknown) => toValue,
    withRepeat: (animation: unknown, iterations?: number, reverse?: boolean) => animation,
    withDelay: (delay: number, animation: unknown) => animation,
    Easing: {
      out: (easing: (t: number) => number) => easing,
      inOut: (easing: (t: number) => number) => easing,
      poly: (n: number) => (t: number) => Math.pow(t, n),
      exp: (t: number) => Math.pow(2, 10 * (t - 1)),
      cubic: (t: number) => t * t * t,
    },
  }
})

// Mock react-native
vi.mock('react-native', () => {
  return {
    Platform: {
      OS: 'web',
      select: (obj: { web?: unknown; default?: unknown }) => obj.web || obj.default,
    },
    AccessibilityInfo: {
      isReduceMotionEnabled: () => Promise.resolve(false),
      addEventListener: () => ({ remove: () => {} }),
    },
  }
})

// Mock window.matchMedia for reduced motion
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
