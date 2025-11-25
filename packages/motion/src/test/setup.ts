/**
 * Test setup for @petspark/motion package
 */

import { vi } from 'vitest'

// Mock react-native-reanimated (no async import to avoid Promise spread)
vi.mock('react-native-reanimated', () => {
  return {
    useSharedValue: (initialValue: unknown) => ({
      value: initialValue,
    }),
    useAnimatedStyle: (updater: () => unknown) => updater(),
    withSpring: (toValue: number, _config?: unknown) => toValue,
    withTiming: (toValue: number, _config?: unknown) => toValue,
    withRepeat: (animation: unknown, _iterations?: number, _reverse?: boolean) => animation,
    withDelay: (_delay: number, animation: unknown) => animation,
    Easing: {
      out: (easing: (t: number) => number) => easing,
      inOut: (easing: (t: number) => number) => easing,
      poly: (n: number) => (t: number) => Math.pow(t, n),
      exp: (t: number) => Math.pow(2, 10 * (t - 1)),
      cubic: (t: number) => t * t * t,
      linear: (t: number) => t,
      elastic: (_bounciness: number) => (t: number) => t,
    },
  }
})

// Mock react-native
vi.mock('react-native', () => {
  return {
    Platform: {
      OS: 'web',
      select: (obj: { web?: unknown; default?: unknown }) => obj.web ?? obj.default,
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
