// Re-enable testing-library now that resolver conditions are set
import { cleanup } from '@testing-library/react-native'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
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
  const Reanimated = {
    default: {
      call: () => {},
    },
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: number) => value,
    withSpring: (value: number) => value,
    withRepeat: (value: number) => value,
    withSequence: (...args: unknown[]) => args,
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
