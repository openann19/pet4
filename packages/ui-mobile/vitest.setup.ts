import '@testing-library/jest-native/extend-expect';
import { vi } from 'vitest';

// Type declarations for test matchers
declare global {
  namespace Vi {
    interface JestMatchers<T> {
      toBeInTheDocument(): T;
      toHaveTextContent(text: string | RegExp): T;
      toBeDisabled(): T;
      toHaveProp(prop: string, value?: any): T;
    }
  }
}

// Mock react-native modules
vi.mock('react-native', () => {
  const RN = vi.importActual('react-native');
  return {
    ...RN,
    Dimensions: {
      get: vi.fn(() => ({ width: 375, height: 667 })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    Platform: {
      OS: 'ios',
      select: vi.fn((config: any) => config.ios || config.default),
    },
    StatusBar: {
      currentHeight: 0,
    },
  };
});

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    call: () => {},
  },
  Value: class {},
  event: () => ({}),
  add: () => ({}),
  eq: () => ({}),
  set: () => ({}),
  cond: () => ({}),
  interpolate: () => ({}),
  Animated: {
    View: 'View',
    Text: 'Text',
    Image: 'Image',
    ScrollView: 'ScrollView',
  },
}));

// Mock react-native-gesture-handler
vi.mock('react-native-gesture-handler', () => {
  const View = 'View';
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: vi.fn((component: any) => component),
    Directions: {},
  };
});

// Mock react-native-haptic-feedback
vi.mock('react-native-haptic-feedback', () => ({
  trigger: vi.fn(),
  HapticFeedbackTypes: {
    selection: 'selection',
    impactLight: 'impactLight',
    impactMedium: 'impactMedium',
    impactHeavy: 'impactHeavy',
    notificationSuccess: 'notificationSuccess',
    notificationWarning: 'notificationWarning',
    notificationError: 'notificationError',
  },
}));

// Mock react-native-safe-area-context
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: 'View',
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 667 }),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly testing it
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
