// Testing library - use actual implementation
// Cleanup after each test is handled by Jest automatically

// Set globals/env expected by app code
Object.defineProperty(global, '__DEV__', {
  value: false,
  configurable: true,
  writable: true,
})
process.env['EXPO_PUBLIC_API_URL'] = process.env['EXPO_PUBLIC_API_URL'] ?? ''
process.env['EXPO_PUBLIC_ANALYTICS_ENDPOINT'] = process.env['EXPO_PUBLIC_ANALYTICS_ENDPOINT'] ?? ''

// Help surface early syntax errors with clearer stacks during environment boot
// Jest will handle these errors in its test environment
process.on('uncaughtException', err => {
  // Jest will handle these errors in its test environment
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
jest.mock('react-native', () => {
  const React = require('react')
  const MockComponent = (props: any) => React.createElement('View', props)

  return {
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: jest.fn((obj: Record<string, unknown>) => obj['ios'] || obj['default']),
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
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Animated: {
      Value: jest.fn((value) => ({ _value: value })),
      View: MockComponent,
      Text: MockComponent,
      timing: jest.fn((): { start: () => void } => ({ start: jest.fn() })),
      spring: jest.fn((): { start: () => void } => ({ start: jest.fn() })),
      sequence: jest.fn((animations) => ({ start: jest.fn() })),
      parallel: jest.fn((animations) => ({ start: jest.fn() })),
      loop: jest.fn((animation) => ({ start: jest.fn() })),
    },
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
    },
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Keyboard: {
      dismiss: jest.fn(),
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
    },
    NativeModules: {},
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  }
})

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(null),
  selectionAsync: jest.fn().mockResolvedValue(null),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}))

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
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
jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: () => ({
      onChange: jest.fn(() => ({ onChange: jest.fn() })),
    }),
    Pinch: () => ({
      onChange: jest.fn(() => ({ onChange: jest.fn() })),
    }),
    Simultaneous: jest.fn((...args: unknown[]) => args),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}))

// Note: reduced-motion files need to be mocked in individual test files if needed
// Jest handles module resolution differently than Vitest
