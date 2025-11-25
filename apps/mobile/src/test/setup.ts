import { createRequire } from 'node:module'
import { vi } from 'vitest'

const require = createRequire(import.meta.url)

const jestGlobal = {
  mock: vi.mock.bind(vi),
  fn: vi.fn.bind(vi),
  spyOn: vi.spyOn.bind(vi),
  clearAllMocks: vi.clearAllMocks.bind(vi),
  useFakeTimers: vi.useFakeTimers.bind(vi),
  useRealTimers: vi.useRealTimers.bind(vi),
  advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
  runAllTimers: vi.runAllTimers.bind(vi),
  setSystemTime: vi.setSystemTime.bind(vi),
}
;(globalThis as Record<string, unknown>).jest = jestGlobal

// Testing library - use actual implementation
// Cleanup after each test is handled by Vitest automatically

// Set globals/env expected by app code
Object.defineProperty(global, '__DEV__', {
  value: false,
  configurable: true,
  writable: true,
})
process.env['EXPO_PUBLIC_API_URL'] = process.env['EXPO_PUBLIC_API_URL'] ?? ''
process.env['EXPO_PUBLIC_ANALYTICS_ENDPOINT'] = process.env['EXPO_PUBLIC_ANALYTICS_ENDPOINT'] ?? ''

// Help surface early syntax errors with clearer stacks during environment boot
// Vitest will handle these errors in its test environment
process.on('uncaughtException', err => {
  // Vitest will handle these errors in its test environment
  // Only log if we're not in a test environment (shouldn't happen in tests)
  if (typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'test') {
    // In non-test environments, these should be handled by the application
    throw err
  }
})
process.on('unhandledRejection', reason => {
  // Jest will handle these errors in its test environment
  // Only throw if we're not in a test environment (shouldn't happen in tests)
  if (typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'test') {
    throw new Error(`Unhandled rejection: ${String(reason)}`)
  }
})

// Mock React Native modules
vi.mock('react-native', () => {
  const React = require('react')
  const MockComponent = (props: any) => React.createElement('View', props)

  return {
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: vi.fn((obj: Record<string, unknown>) => obj['ios'] || obj['default']),
    },
    View: MockComponent,
    Text: MockComponent,
    Pressable: MockComponent,
    TouchableOpacity: MockComponent,
    ScrollView: MockComponent,
    Image: MockComponent,
    ImageBackground: MockComponent,
    ActivityIndicator: MockComponent,
    RefreshControl: MockComponent,
    TextInput: MockComponent,
    Switch: MockComponent,
    StyleSheet: {
      create: (styles: Record<string, unknown>) => styles,
      hairlineWidth: 0.5,
      flatten: (style: any) => style,
    },
    Dimensions: {
      get: () => ({ width: 375, height: 812 }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    Animated: {
      Value: vi.fn((value) => ({ _value: value })),
      View: MockComponent,
      Text: MockComponent,
      timing: vi.fn((): { start: () => void } => ({ start: vi.fn() })),
      spring: vi.fn((): { start: () => void } => ({ start: vi.fn() })),
      sequence: vi.fn((animations) => ({ start: vi.fn() })),
      parallel: vi.fn((animations) => ({ start: vi.fn() })),
      loop: vi.fn((animation) => ({ start: vi.fn() })),
    },
    Easing: {
      linear: vi.fn(),
      ease: vi.fn(),
      quad: vi.fn(),
      cubic: vi.fn(),
    },
    AppState: {
      currentState: 'active',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    Keyboard: {
      dismiss: vi.fn(),
      addListener: vi.fn(() => ({ remove: vi.fn() })),
      removeListener: vi.fn(),
    },
    NativeModules: {},
    NativeEventEmitter: vi.fn(() => ({
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
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

const createReanimatedMock = () => {
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

  return {
    default: {
      call: () => {},
      createAnimatedComponent: <T>(component: T) => component,
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
      elastic: (_bounciness: number) => (t: number) => t,
      bezier: () => (t: number) => t,
    },
    FadeIn: {
      duration: () => ({}),
    },
    FadeOut: {
      duration: () => ({}),
    },
    Layout: {
      springify: () => ({}),
    },
  }
}

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => createReanimatedMock())
vi.mock('react-native-reanimated/mock', () => createReanimatedMock())

vi.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({}),
  NativeModulesProxy: {},
  EventEmitter: class {
    addListener() {
      return { remove: () => {} }
    }
    removeAllListeners() {}
  },
}))

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {},
    manifest: {},
    linkingUri: 'https://example.com/',
    platform: { ios: { model: 'Vitest' }, android: { model: 'Vitest' } },
  },
}))

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('expo-notifications', () => ({
  getDevicePushTokenAsync: vi.fn().mockResolvedValue({ data: 'mock-token' }),
  setNotificationHandler: vi.fn(),
  addNotificationReceivedListener: vi.fn(() => ({ remove: () => {} })),
  addNotificationResponseReceivedListener: vi.fn(() => ({ remove: () => {} })),
  removeNotificationSubscription: vi.fn(),
}))

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

// Note: reduced-motion files need to be mocked in individual test files if needed
// Vitest handles module resolution differently than Jest
