import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';
import { createMockMatchMedia } from './mocks/match-media';
import { createMockIntersectionObserver } from './mocks/intersection-observer';
import { createMockResizeObserver } from './mocks/resize-observer';
import { setupStorageMocks } from './mocks/storage';
import { setupWebRTCMocks } from './mocks/webrtc';

type GlobalWithDevFlag = typeof globalThis & { __DEV__?: boolean };

// React Native (web) minimal shims
(globalThis as GlobalWithDevFlag).__DEV__ = true;

interface HapticsShim {
  trigger: (type: string) => void;
  light: () => void;
  medium: () => void;
  heavy: () => void;
  selection: () => void;
  success: () => void;
  warning: () => void;
  error: () => void;
}

// Minimal haptics shim expected by UI components during tests
const globalWithHaptics = globalThis as typeof globalThis & { haptics?: HapticsShim };
const hapticsMock = vi.fn(() => undefined);
const shim: HapticsShim = {
  trigger: hapticsMock,
  light: vi.fn(() => undefined),
  medium: vi.fn(() => undefined),
  heavy: vi.fn(() => undefined),
  selection: vi.fn(() => undefined),
  success: vi.fn(() => undefined),
  warning: vi.fn(() => undefined),
  error: vi.fn(() => undefined),
};

globalWithHaptics.haptics = shim;

// Mock the haptics module to use the global shim
vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
    light: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    selection: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    impact: vi.fn(),
  },
  triggerHaptic: vi.fn((type: string) => shim.trigger(type)),
  HapticFeedbackType: {
    light: 'light',
    medium: 'medium',
    heavy: 'heavy',
    selection: 'selection',
    success: 'success',
    warning: 'warning',
    error: 'error',
  },
}));

// Logger mock - comprehensive mock matching actual logger implementation
const mockLoggerInstance = {
  warn: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  setLevel: vi.fn(),
  addHandler: vi.fn(),
};

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => mockLoggerInstance),
  logger: mockLoggerInstance,
  log: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  LogLevel: {
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40,
    NONE: 100,
  },
}));

vi.mock('@/config/env', () => ({
  env: {
    VITE_API_URL: 'https://api.dev-petspark.test',
    VITE_WS_URL: 'wss://ws.dev-petspark.test',
    VITE_API_TIMEOUT: 5000,
    VITE_USE_MOCKS: 'false',
    VITE_ENABLE_MAPS: false,
    VITE_MAPBOX_TOKEN: undefined,
  },
  ENV: {
    VITE_API_URL: 'https://api.dev-petspark.test',
    VITE_WS_URL: 'wss://ws.dev-petspark.test',
    VITE_API_TIMEOUT: 5000,
    VITE_USE_MOCKS: 'false',
    VITE_ENABLE_MAPS: false,
    VITE_MAPBOX_TOKEN: undefined,
  },
  flags: {
    mocks: false,
    maps: false,
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
    absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
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

// Reanimated mock (stable across tests)
vi.mock('react-native-reanimated', () => {
  const createMockSharedValueReanimated = (initial: number) => {
    let currentValue = initial;
    const value = {
      get value() {
        return currentValue;
      },
      set value(newValue: number) {
        // Test environment: animations resolve immediately for deterministic testing
        // Production: animations run on UI thread with worklet timing
        if (typeof newValue === 'number') {
          currentValue = newValue;
        } else {
          // Animation objects (withSpring, withTiming) are resolved to target values
          // This simulates completed animation state for test assertions
          currentValue = typeof newValue === 'number' ? newValue : currentValue;
        }
      },
      get: () => currentValue,
      set: vi.fn((val: number) => {
        currentValue = val;
      }),
    };
    return value;
  };

  const AnimatedComponent = ({
    children,
    style,
    ...props
  }: {
    children?: React.ReactNode;
    style?: Record<string, unknown>;
    [key: string]: unknown;
  }) => {
    return React.createElement('div', { style, ...props }, children);
  };

  const AnimatedA = ({
    children,
    style,
    ...props
  }: {
    children?: React.ReactNode;
    style?: Record<string, unknown>;
    [key: string]: unknown;
  }) => {
    return React.createElement('a', { style, ...props }, children);
  };

  const AnimatedNamespace = {
    View: AnimatedComponent,
    div: AnimatedComponent,
    a: AnimatedA,
    Image: AnimatedComponent,
    Text: AnimatedComponent,
  };

  // Make default export work as both component and namespace
  Object.assign(AnimatedComponent, AnimatedNamespace);

  // Also make AnimatedComponent itself have div and a properties for direct access
  AnimatedComponent.div = AnimatedComponent;
  AnimatedComponent.a = AnimatedA;

  return {
    default: AnimatedComponent,
    Animated: AnimatedNamespace,
    useSharedValue: vi.fn((initial: number) => createMockSharedValueReanimated(initial)),
    useDerivedValue: vi.fn((fn: () => number) => {
      try {
        return createMockSharedValueReanimated(fn());
      } catch {
        return createMockSharedValueReanimated(0);
      }
    }),
    useAnimatedStyle: vi.fn((fn: () => Record<string, unknown>) => {
      try {
        return fn();
      } catch {
        return {};
      }
    }),
    withSpring: vi.fn((toValue: number, _config?: unknown) => {
      // Test mock: returns target value immediately for deterministic test results
      // Production: returns worklet animation object that animates on UI thread
      return toValue;
    }),
    withTiming: vi.fn((toValue: number, _config?: unknown) => {
      return toValue;
    }),
    withDelay: vi.fn((delay: number, animation: unknown) => {
      // If delay > 0, preserve current value (animation will run later)
      // For tests, we return the animation value directly if delay is 0
      if (delay === 0) {
        return animation;
      }
      // For non-zero delays, return the animation (tests can use fake timers)
      return animation;
    }),
    withSequence: vi.fn((...animations: unknown[]) => {
      // Return the last animation value in the sequence
      return animations[animations.length - 1];
    }),
    withRepeat: vi.fn((animation: number) => animation),
    interpolate: vi.fn((value: number, inputRange: number[], outputRange: number[]) => {
      if (!inputRange || inputRange.length === 0 || !outputRange || outputRange.length === 0) {
        return outputRange?.[0] ?? 0;
      }
      const firstInput = inputRange[0];
      const lastInput = inputRange[inputRange.length - 1];
      const firstOutput = outputRange[0];
      const lastOutput = outputRange[outputRange.length - 1];
      if (
        firstInput === undefined ||
        lastInput === undefined ||
        firstOutput === undefined ||
        lastOutput === undefined
      ) {
        return 0;
      }
      if (value <= firstInput) return firstOutput;
      if (value >= lastInput) return lastOutput;
      return firstOutput;
    }),
    Extrapolation: {
      CLAMP: 'clamp',
      EXTEND: 'extend',
      IDENTITY: 'identity',
    },
    Easing: {
      linear: (t: number) => t,
      ease: (t: number) => t,
      quad: (t: number) => t * t,
      cubic: (t: number) => t * t * t,
      in: (easing: (t: number) => number) => easing,
      out: (easing: (t: number) => number) => easing,
      inOut: (easing: (t: number) => number) => easing,
      elastic: () => (t: number) => t,
    },
    cancelAnimation: vi.fn(),
    withDecay: vi.fn((toValue: number) => toValue),
    runOnJS: vi.fn((fn: () => void) => fn),
    useAnimatedReaction: vi.fn(),
    useAnimatedProps: vi.fn((fn: () => Record<string, unknown>) => {
      try {
        return fn();
      } catch {
        return {};
      }
    }),
    useAnimatedGestureHandler: vi.fn(),
    useAnimatedScrollHandler: vi.fn(),
    useAnimatedRef: vi.fn(() => ({ current: null })),
    createAnimatedComponent: vi.fn((component: unknown) => component),
    withClamp: vi.fn((animation: number) => animation),
    makeMutable: vi.fn((initial: number) => createMockSharedValueReanimated(initial)),
    makeRemote: vi.fn((initial: number) => createMockSharedValueReanimated(initial)),
  };
});

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// MatchMedia shim for reduced-motion tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: createMockMatchMedia,
});

global.IntersectionObserver = createMockIntersectionObserver();
global.ResizeObserver = createMockResizeObserver();

// TouchEvent polyfill for jsdom (doesn't support TouchEvent by default)
if (typeof TouchEvent === 'undefined') {
  (global as typeof globalThis & { TouchEvent: typeof TouchEvent }).TouchEvent =
    class TouchEvent extends Event {
      readonly touches: TouchList;
      readonly targetTouches: TouchList;
      readonly changedTouches: TouchList;
      readonly altKey: boolean;
      readonly metaKey: boolean;
      readonly ctrlKey: boolean;
      readonly shiftKey: boolean;

      constructor(type: string, eventInitDict?: TouchEventInit) {
        super(type, eventInitDict);

        // Create TouchList from touches array if provided
        const touchesArray = (eventInitDict?.touches as Touch[]) || [];
        const targetTouchesArray = (eventInitDict?.targetTouches as Touch[]) || [];
        const changedTouchesArray = (eventInitDict?.changedTouches as Touch[]) || [];

        // Create TouchList objects
        const createTouchList = (touches: Touch[]): TouchList => {
          const list = touches as unknown as TouchList;
          list.item = (index: number) => touches[index] || null;
          return list;
        };

        this.touches = createTouchList(touchesArray);
        this.targetTouches = createTouchList(targetTouchesArray);
        this.changedTouches = createTouchList(changedTouchesArray);
        this.altKey = eventInitDict?.altKey || false;
        this.metaKey = eventInitDict?.metaKey || false;
        this.ctrlKey = eventInitDict?.ctrlKey || false;
        this.shiftKey = eventInitDict?.shiftKey || false;
      }
    } as typeof TouchEvent;

  // Touch polyfill
  if (typeof Touch === 'undefined') {
    (global as typeof globalThis & { Touch: typeof Touch }).Touch = class Touch {
      readonly identifier: number;
      readonly target: EventTarget;
      readonly clientX: number;
      readonly clientY: number;
      readonly pageX: number;
      readonly pageY: number;
      readonly screenX: number;
      readonly screenY: number;
      readonly radiusX: number;
      readonly radiusY: number;
      readonly rotationAngle: number;
      readonly force: number;

      constructor(touchInitDict: TouchInit | Partial<Touch>) {
        const init = touchInitDict as TouchInit & Partial<Touch>;
        this.identifier = init.identifier ?? 0;
        this.target = init.target ?? ({} as EventTarget);
        this.clientX = init.clientX ?? 0;
        this.clientY = init.clientY ?? 0;
        this.pageX = init.pageX ?? init.clientX ?? 0;
        this.pageY = init.pageY ?? init.clientY ?? 0;
        this.screenX = init.screenX ?? init.clientX ?? 0;
        this.screenY = init.screenY ?? init.clientY ?? 0;
        this.radiusX = init.radiusX ?? 0;
        this.radiusY = init.radiusY ?? 0;
        this.rotationAngle = init.rotationAngle ?? 0;
        this.force = init.force ?? 0;
      }
    } as typeof Touch;
  }

  // TouchList polyfill
  if (typeof TouchList === 'undefined') {
    (global as typeof globalThis & { TouchList: typeof TouchList }).TouchList =
      class TouchList extends Array<Touch> {
        item(index: number): Touch | null {
          return this[index] || null;
        }
      } as typeof TouchList;
  }
}

// Setup storage mocks (IndexedDB, localStorage)
setupStorageMocks();

// Setup WebRTC mocks
setupWebRTCMocks();

// Mock MapLibre GL
vi.mock('maplibre-gl', async () => {
  const { mockMapLibre } = await import('./mocks/maps');
  return {
    default: mockMapLibre,
    ...mockMapLibre,
  };
});

// Mock Leaflet
vi.mock('leaflet', async () => {
  const { mockLeaflet } = await import('./mocks/maps');
  return {
    default: mockLeaflet,
    ...mockLeaflet,
  };
});

// Mock API Client - but allow tests to override with vi.unmock if needed
// For integration tests that need real HTTP, use vi.unmock('@/lib/api-client') in the test file
vi.mock('@/lib/api-client', async () => {
  // Check if we should use the real implementation (for integration tests)
  // Tests can set process.env.USE_REAL_API_CLIENT = 'true' to use real client
  if (process.env.USE_REAL_API_CLIENT === 'true') {
    return await vi.importActual('@/lib/api-client');
  }

  const { createMockAPIClient } = await import('./mocks/api-client');
  const mockClient = createMockAPIClient();
  return {
    APIClient: mockClient,
    APIClientError: class extends Error {
      status: number;
      code?: string;
      details?: Record<string, unknown>;
      constructor(
        message: string,
        init: { status: number; code?: string; details?: Record<string, unknown> }
      ) {
        super(message);
        this.name = 'APIClientError';
        this.status = init.status;
        this.code = init.code;
        this.details = init.details;
      }
    },
  };
});

// Mock storage service - prevent real module evaluation to avoid logger.warn calls
vi.mock('@/lib/storage', () => {
  const mockStorage = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    getAll: vi.fn(),
    initDB: vi.fn(() => Promise.resolve()),
  };
  return {
    storage: mockStorage,
  };
});

// Mock realtime service
vi.mock('@/lib/realtime', () => {
  // Create a mock RealtimeClient class
  class RealtimeClient {
    private listeners = new Map<string, Set<(data: unknown) => void>>();
    private connected = false;
    private accessToken: string | null = null;

    setAccessToken = vi.fn((token: string | null) => {
      this.accessToken = token;
    });

    connect = vi.fn(() => {
      this.connected = true;
    });

    disconnect = vi.fn(() => {
      this.connected = false;
    });

    on = vi.fn((event: string, callback: (data: unknown) => void) => {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(callback);
    });

    off = vi.fn((event: string, callback: (data: unknown) => void) => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    });

    emit = vi.fn((event: string, data: unknown): Promise<{ success: boolean; error?: string }> => {
      return Promise.resolve({ success: this.connected });
    });

    trigger = vi.fn((event: string, data: unknown) => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            // Ignore errors in test
          }
        });
      }
    });

    subscribe = vi.fn();
    unsubscribe = vi.fn();
    publish = vi.fn();
  }

  const realtimeInstance = new RealtimeClient();

  return {
    RealtimeClient,
    realtime: realtimeInstance,
  };
});

// Mock websocket manager
vi.mock('@/lib/websocket-manager', () => ({
  WebSocketManager: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    isConnected: vi.fn(() => false),
  })),
}));

// Mock query client
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(() => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
      removeQueries: vi.fn(),
    })),
    QueryClient: vi.fn().mockImplementation(() => ({
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
      removeQueries: vi.fn(),
    })),
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock @petspark/motion
vi.mock('@petspark/motion', () => {
  // Import mocked Reanimated functions
  const createMockSharedValue = (initial: number) => {
    let currentValue = initial;
    return {
      get value() {
        return currentValue;
      },
      set value(newValue: number) {
        currentValue = newValue;
      },
      get: () => currentValue,
      set: vi.fn((value: number) => {
        currentValue = value;
      }),
    };
  };

  const mockUseAnimatedStyle = vi.fn((fn: () => Record<string, unknown>) => {
    try {
      return fn();
    } catch {
      return {};
    }
  });

  // Create Animated namespace matching react-native-reanimated mock
  const AnimatedComponent = ({
    children,
    style,
    ...props
  }: {
    children?: React.ReactNode;
    style?: Record<string, unknown>;
    [key: string]: unknown;
  }) => {
    return React.createElement('div', { style, ...props }, children);
  };

  const AnimatedNamespace = {
    View: AnimatedComponent,
    Text: AnimatedComponent,
    Image: AnimatedComponent,
    ScrollView: AnimatedComponent,
    div: AnimatedComponent,
    a: AnimatedComponent,
  };

  return {
    // Export Animated as named export (matches motion package exports)
    Animated: AnimatedNamespace,
    motion: {
      div: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
        React.createElement('div', props, children),
      span: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
        React.createElement('span', props, children),
      button: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
        React.createElement('button', props, children),
    },
    MotionView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
    MotionText: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('span', props, children),
    MotionScrollView: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => React.createElement('div', props, children),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
    Presence: ({ children }: { children?: React.ReactNode }) => children,
    useMotionValue: vi.fn(() => ({ get: () => 0, set: vi.fn() })),
    useSpring: vi.fn(() => ({ get: () => 0 })),
    useTransform: vi.fn(() => ({ get: () => 0 })),
    useAnimation: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn(),
    })),
    useHoverLift: vi.fn((_px = 8, _scale = 1.03) => {
      const mockStyle = { transform: [{ translateY: 0 }, { scale: 1 }] };
      return {
        onMouseEnter: vi.fn(),
        onMouseLeave: vi.fn(),
        animatedStyle: mockStyle,
      };
    }),
    useSharedValue: vi.fn((initial: number) => createMockSharedValue(initial)),
    useAnimatedStyle: mockUseAnimatedStyle,
    useAnimatedProps: vi.fn((fn: () => Record<string, unknown>) => {
      try {
        return fn();
      } catch {
        return {};
      }
    }),
    withSpring: vi.fn((toValue: number) => toValue),
    withTiming: vi.fn((toValue: number) => toValue),
    withRepeat: vi.fn((animation: unknown) => animation),
    withSequence: vi.fn((...args: unknown[]) => args[args.length - 1]),
    withDelay: vi.fn((_delay: number, animation: unknown) => animation),
    usePressBounce: vi.fn(() => ({
      onPressIn: vi.fn(),
      onPressOut: vi.fn(),
      animatedStyle: {},
    })),
    useMagnetic: vi.fn(() => ({
      onMouseMove: vi.fn(),
      animatedStyle: {},
    })),
    useParallax: vi.fn(() => ({
      onMouseMove: vi.fn(),
      animatedStyle: {},
    })),
    useShimmer: vi.fn(() => ({
      animatedStyle: {},
    })),
    useRipple: vi.fn(() => ({
      onPress: vi.fn(),
      animatedStyle: {},
    })),
    useReducedMotion: vi.fn(() => false),
    useReducedMotionSV: vi.fn(() => createMockSharedValue(0)),
    isReduceMotionEnabled: vi.fn(() => false),
    getReducedMotionDuration: vi.fn((duration: number) => duration),
    getReducedMotionMultiplier: vi.fn(() => 1),
    usePerfBudget: vi.fn(() => ({ withinBudget: true, frameTime: 16 })),
    haptic: vi.fn(),
    usePageTransitions: vi.fn(() => ({
      transition: {},
      animatedStyle: {},
    })),
  };
});

// Mock @/effects/reanimated/animated-view
vi.mock('@/effects/reanimated/animated-view', () => {
  const AnimatedView = ({ children, style, ...props }: {
    children?: React.ReactNode;
    style?: Record<string, unknown>;
    [key: string]: unknown;
  }) => {
    return React.createElement('div', { style, ...props }, children);
  };

  return {
    AnimatedView,
    useAnimatedStyleValue: vi.fn((style: unknown) => {
      if (typeof style === 'function') {
        try {
          return style();
        } catch {
          return {};
        }
      }
      return style || {};
    }),
  };
});
