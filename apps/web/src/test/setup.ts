import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

vi.mock('@/config/env', () => ({
  ENV: {
    VITE_API_URL: 'http://localhost:8080',
    VITE_WS_URL: 'ws://localhost:8080',
    VITE_API_TIMEOUT: 5000,
    VITE_JWT_SECRET: 'abcdefghijklmnopqrstuvwxyz012345',
    VITE_JWT_EXPIRY: '7d',
    VITE_REFRESH_TOKEN_EXPIRY: '30d',
    VITE_USE_MOCKS: 'false',
    VITE_ENABLE_KYC: true,
    VITE_ENABLE_PAYMENTS: true,
    VITE_ENABLE_LIVE_STREAMING: true,
    VITE_MAPBOX_TOKEN: 'pk.test-token',
    VITE_STRIPE_PUBLIC_KEY: 'pk_test_1234567890',
    VITE_SENTRY_DSN: 'http://example.com/123',
    VITE_SENTRY_TRACES_SAMPLE_RATE: 0.1,
    VITE_CORS_ORIGIN: 'http://localhost:3000',
    VITE_CSP_ENABLED: true,
    VITE_APP_VERSION: 'test',
    VITE_ENVIRONMENT: 'development',
  },
}));

// Mock react-native for web tests
vi.mock('react-native', () => ({
  View: 'div',
  Text: 'span',
  Image: 'img',
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
    hairlineWidth: 1,
  },
  Platform: {
    OS: 'web',
  },
}));

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'div',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock react-native-gesture-handler
vi.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: () => ({
      onChange: vi.fn(),
      onEnd: vi.fn(),
    }),
    Simultaneous: vi.fn(),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
  const mockSharedValue = (initial: number) => {
    const value = { value: initial }
    return value
  }
  
  return {
    default: {
      call: () => {}
    },
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
    withDelay: vi.fn((delay: number, animation: number) => animation),
    withSequence: vi.fn((...animations: number[]) => animations[animations.length - 1]),
    withRepeat: vi.fn((animation: number) => animation),
    interpolate: vi.fn((value: number, inputRange: number[], outputRange: number[]) => {
      if (value <= inputRange[0]) return outputRange[0]
      if (value >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1]
      return outputRange[0]
    }),
    Extrapolation: {
      CLAMP: 'clamp',
      EXTEND: 'extend',
      IDENTITY: 'identity'
    },
    Easing: {
      linear: (t: number) => t,
      ease: (t: number) => t,
      quad: (t: number) => t * t,
      cubic: (t: number) => t * t * t,
      in: (easing: (t: number) => number) => easing,
      out: (easing: (t: number) => number) => easing,
      inOut: (easing: (t: number) => number) => easing,
      elastic: () => (t: number) => t
    },
    cancelAnimation: vi.fn(),
    withDecay: vi.fn((toValue: number) => toValue)
  }
})

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
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
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root: Element | Document | null = null
  rootMargin: string = ''
  thresholds: ReadonlyArray<number> = []
  
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;
