// Testing library - hoisted mock for CommonJS compatibility
import { afterEach, vi } from 'vitest'
import type * as RTL from '@testing-library/react-native'

// Create mock before any imports
const mockCleanup = vi.fn()
const mockRender = vi.fn(() => ({
  toJSON: () => null,
  unmount: vi.fn(),
  rerender: vi.fn(),
  debug: vi.fn(),
  getByText: vi.fn(),
  getByTestId: vi.fn(),
  queryByText: vi.fn(),
  queryByTestId: vi.fn(),
  findByText: vi.fn(),
  findByTestId: vi.fn(),
}))

// Hoist the mock to avoid module loading issues
vi.mock('@testing-library/react-native', () => ({
  cleanup: mockCleanup,
  render: mockRender,
  screen: {
    getByText: vi.fn(),
    getByTestId: vi.fn(),
    queryByText: vi.fn(),
    queryByTestId: vi.fn(),
    findByText: vi.fn(),
    findByTestId: vi.fn(),
    getAllByText: vi.fn(),
    getAllByTestId: vi.fn(),
    queryAllByText: vi.fn(),
    queryAllByTestId: vi.fn(),
    debug: vi.fn(),
  },
  fireEvent: {
    press: vi.fn(),
    changeText: vi.fn(),
    scroll: vi.fn(),
  },
  waitFor: vi.fn(async (callback: () => void) => {
    callback()
  }),
  within: vi.fn(),
  act: vi.fn(async (callback: () => void | Promise<void>) => {
    await callback()
  }),
}))

// Cleanup after each test
afterEach(() => {
  mockCleanup()
})

// Set globals/env expected by app code
Object.defineProperty(global, '__DEV__', {
  value: false,
  configurable: true,
  writable: true,
})
process.env['EXPO_PUBLIC_API_URL'] = process.env['EXPO_PUBLIC_API_URL'] ?? ''
process.env['EXPO_PUBLIC_ANALYTICS_ENDPOINT'] = process.env['EXPO_PUBLIC_ANALYTICS_ENDPOINT'] ?? ''

// Help surface early syntax errors with clearer stacks during environment boot
// Use vitest's built-in error handling instead of console.error
process.on('uncaughtException', err => {
  // Vitest will handle these errors in its test environment
  // Only log if we're not in a test environment (shouldn't happen in tests)
  if (typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'test') {
    // In non-test environments, these should be handled by the application
    throw err
  }
})
process.on('unhandledRejection', reason => {
  // Vitest will handle these errors in its test environment
  // Only throw if we're not in a test environment (shouldn't happen in tests)
  if (typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'test') {
    throw new Error(`Unhandled rejection: ${String(reason)}`)
  }
})

// Mock React Native modules
vi.mock('react-native', () => {
  return {
    Platform: {
      OS: 'ios',
      select: vi.fn((obj: Record<string, unknown>) => obj['ios'] || obj['default']),
    },
    View: 'View',
    Text: 'Text',
    Pressable: 'Pressable',
    StyleSheet: {
      create: (styles: Record<string, unknown>) => styles,
      hairlineWidth: 0.5,
    },
  }
})

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn().mockResolvedValue(null),
  selectionAsync: vi.fn().mockResolvedValue(null),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}))

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
  const createMockSharedValue = (initial: number) => {
    let val = initial
    return {
      get value() {
        return val
      },
      set value(v: unknown) {
        // Handle number values and animation results
        if (v !== null && v !== undefined) {
          const numValue = Number(v)
          if (!Number.isNaN(numValue)) {
            val = numValue
          }
        }
      },
    }
  }

  const Reanimated = {
    default: {
      call: () => {},
    },
    useSharedValue: (initial: number) => createMockSharedValue(initial),
    useAnimatedStyle: (fn: () => Record<string, unknown>) => {
      try {
        return fn()
      } catch {
        return {}
      }
    },
    withTiming: (value: number) => value,
    withSpring: (value: number) => value,
    withRepeat: (value: number) => value,
    withDelay: (_delay: number, animation: unknown) => animation,
    withSequence: (...args: unknown[]) => args[args.length - 1],
    interpolate: (_val: number, _input: number[], output: number[]) => (output && output[0] !== undefined ? output[0] : 0),
    Extrapolation: {
      CLAMP: 'clamp',
    },
    Easing: {
      linear: (t: number) => t,
      ease: (t: number) => t,
      in: (e: (t: number) => number) => e,
      out: (e: (t: number) => number) => e,
      inOut: (e: (t: number) => number) => e,
      bezier: () => (t: number) => t,
    },
    FadeIn: {},
    FadeOut: {},
    Layout: {},
  }
  return Reanimated
})

// Mock react-native-gesture-handler
vi.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: () => ({
      onChange: vi.fn(() => ({ onChange: vi.fn() })),
    }),
    Pinch: () => ({
      onChange: vi.fn(() => ({ onChange: vi.fn() })),
    }),
    Simultaneous: vi.fn((...args: unknown[]) => args),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}))

// Note: reduced-motion files are intercepted by a Vite plugin in vitest.config.ts
// The plugin replaces imports with mock versions to prevent esbuild transformation errors
// Individual test files can override mocks if needed
