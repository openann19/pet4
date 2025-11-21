import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup, act } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';
import { createMockMatchMedia } from './mocks/match-media';
import { createMockIntersectionObserver } from './mocks/intersection-observer';
import { createMockResizeObserver } from './mocks/resize-observer';
import { setupStorageMocks } from './mocks/storage';
import { setupWebRTCMocks } from './mocks/webrtc';
import { cleanupTestState, resetAllMocks } from './utilities/test-helpers';
import type { UseOverlayTransitionOptions, UseOverlayTransitionReturn } from '@petspark/motion';

// Suppress React act() warnings for Radix UI components during testing
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: An update to') &&
      args[0].includes('inside a test was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});

// Mock global fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob(),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    bytes: async () => new Uint8Array(),
    headers: new Headers(),
    redirected: false,
    type: 'default' as ResponseType,
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
  } as unknown as Response)
) as typeof fetch;

type GlobalWithDevFlag = typeof globalThis & { __DEV__?: boolean };

// React Native (web) minimal shims
(globalThis as GlobalWithDevFlag).__DEV__ = true;

// Mock scrollIntoView for Radix UI components
Element.prototype.scrollIntoView = vi.fn();

// Mock transitions to avoid Easing issues
vi.mock('@/effects/reanimated/transitions', async () => {
  const mockModule = await import('./mocks/transitions');
  return mockModule;
});

//========== TEST WRAPPER UTILITIES ==========
// Mock contexts - wrap in act() to handle React state updates
vi.mock('@/contexts/AppContext', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'app-provider' }, children),
  useApp: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
    themePreset: 'default',
    setThemePreset: vi.fn(),
    language: 'en',
    toggleLanguage: vi.fn(),
    setLanguage: vi.fn(),
    t: {
      app: { title: 'PetSpark' },
      common: { loading: 'Loading...', error: 'Error', cancel: 'Cancel', save: 'Save' },
      welcome: {
        title: 'Welcome to PawfectMatch',
        subtitle: 'Smarter matches, safer connections.',
        proof1: 'Smart matching',
        proof2: 'Safe chat',
        proof3: 'Trusted community',
        offlineMessage: 'You appear to be offline. Please check your connection.',
        getStarted: 'Get started',
        signIn: 'I already have an account',
        explore: 'Explore first',
        legal: 'By continuing you agree to our',
        terms: 'Terms',
        and: 'and',
        privacy: 'Privacy Policy',
      },
      chat: {
        createProfile: 'Create Profile',
        createProfileDesc: 'Create your profile first',
        title: 'Chat',
        selectConversation: 'Select a conversation',
        selectConversationDesc: 'Choose a conversation to start chatting',
      },
      discover: { title: 'Discover', noMorePets: 'No more pets', loading: 'Loading pets...' },
      matches: { title: 'Matches', noMatches: 'No matches yet' },
      profile: { myPets: 'My Pets' },
      maps: { title: 'Map' },
      adoption: { title: 'Adoption' },
      community: { title: 'Community' },
      lostfound: { title: 'Lost & Found' },
      errors: { operationFailed: 'Operation failed' },
    },
  }),
}));

// Mock missing native modules
vi.mock('ffmpeg-kit-react-native', () => ({
  FFmpegKit: {
    execute: vi.fn(() => Promise.resolve({ getReturnCode: () => 0 })),
    cancel: vi.fn(),
  },
  ReturnCode: {
    SUCCESS: 0,
    CANCEL: 255,
  },
}));

vi.mock('@/types/next-server', () => ({
  NextResponse: {
    json: vi.fn((data) => ({ json: () => Promise.resolve(data) })),
    redirect: vi.fn((url) => ({ redirect: url })),
  },
}));

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mocked-object-url'),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// Mock File and FileReader
interface FileInit {
  type?: string;
  lastModified?: number;
}

global.File = vi
  .fn()
  .mockImplementation((chunks: unknown[], filename: string, options?: FileInit) => ({
    name: filename,
    size: chunks.reduce((acc: number, chunk: unknown) => {
      const chunkLength = (chunk as { length?: number })?.length ?? 0;
      return acc + chunkLength;
    }, 0),
    type: options?.type ?? '',
    lastModified: Date.now(),
  })) as typeof File;

interface MockFileReaderInstance {
  readAsDataURL: ReturnType<typeof vi.fn>;
  readAsText: ReturnType<typeof vi.fn>;
  readAsArrayBuffer: ReturnType<typeof vi.fn>;
  result: string | ArrayBuffer | null;
  error: DOMException | null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null;
  abort: ReturnType<typeof vi.fn>;
  EMPTY: number;
  LOADING: number;
  DONE: number;
  readyState: number;
}

const MockFileReader = vi.fn().mockImplementation(
  (): MockFileReaderInstance => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    result: null,
    error: null,
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null,
    abort: vi.fn(),
    EMPTY: 0,
    LOADING: 1,
    DONE: 2,
    readyState: 0,
  })
) as unknown as typeof FileReader;

// Assign static properties to the mock constructor
Object.defineProperty(MockFileReader, 'EMPTY', {
  value: 0,
  writable: false,
  enumerable: true,
  configurable: false,
});
Object.defineProperty(MockFileReader, 'LOADING', {
  value: 1,
  writable: false,
  enumerable: true,
  configurable: false,
});
Object.defineProperty(MockFileReader, 'DONE', {
  value: 2,
  writable: false,
  enumerable: true,
  configurable: false,
});

global.FileReader = MockFileReader;

// Mock other common browser APIs
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
Object.defineProperty(window, 'scroll', { value: vi.fn(), writable: true });
Object.defineProperty(Element.prototype, 'scrollTo', { value: vi.fn(), writable: true });

// Mock HTMLCanvasElement methods
// Use type assertion to handle multiple context types
HTMLCanvasElement.prototype.getContext = vi.fn((_contextId?: string, _options?: unknown) => {
  const mockContext = {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  };
  return mockContext as unknown as
    | CanvasRenderingContext2D
    | ImageBitmapRenderingContext
    | WebGLRenderingContext
    | WebGL2RenderingContext
    | null;
}) as typeof HTMLCanvasElement.prototype.getContext;

// Mock HTMLMediaElement methods
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn(() => Promise.resolve()),
});
Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});
Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: vi.fn(),
});

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

// Deterministic haptics mock - tracks call order and provides consistent behavior
interface HapticsCall {
  method: string;
  args: unknown[];
  timestamp: number;
}

let hapticsCallCounter = 0;
const hapticsCalls: HapticsCall[] = [];

const createDeterministicHapticsMock = () => {
  const noop = () => undefined;

  // Deterministic mock that tracks calls in order
  const createMockMethod = (methodName: string) => {
    return vi.fn((...args: unknown[]) => {
      hapticsCallCounter += 1;
      hapticsCalls.push({
        method: methodName,
        args,
        timestamp: hapticsCallCounter, // Deterministic timestamp
      });
      return undefined;
    });
  };

  return {
    trigger: createMockMethod('trigger'),
    light: createMockMethod('light'),
    medium: createMockMethod('medium'),
    heavy: createMockMethod('heavy'),
    selection: createMockMethod('selection'),
    success: createMockMethod('success'),
    warning: createMockMethod('warning'),
    error: createMockMethod('error'),
    impact: createMockMethod('impact'),
    notification: createMockMethod('notification'),
    isHapticSupported: vi.fn(() => false), // Always false in test environment
  };
};

// Minimal haptics shim expected by UI components during tests
const globalWithHaptics = globalThis as typeof globalThis & { haptics?: HapticsShim };
const hapticsMockInstance = createDeterministicHapticsMock();
const shim: HapticsShim = {
  trigger: hapticsMockInstance.trigger,
  light: hapticsMockInstance.light,
  medium: hapticsMockInstance.medium,
  heavy: hapticsMockInstance.heavy,
  selection: hapticsMockInstance.selection,
  success: hapticsMockInstance.success,
  warning: hapticsMockInstance.warning,
  error: hapticsMockInstance.error,
};

globalWithHaptics.haptics = shim;

// Mock the haptics module to use the deterministic mock
vi.mock('@/lib/haptics', () => {
  const hapticsMock = createDeterministicHapticsMock();

  // Ensure all methods are properly bound
  const hapticsProxy = new Proxy(hapticsMock, {
    get(target, prop) {
      if (prop in target && typeof target[prop as keyof typeof target] === 'function') {
        return target[prop as keyof typeof target];
      }
      // Return a deterministic mock function for any missing methods
      return vi.fn(() => undefined);
    },
  });

  return {
    haptics: hapticsProxy,
    triggerHaptic: vi.fn(() => undefined),
    HapticFeedbackType: {
      light: 'light',
      medium: 'medium',
      heavy: 'heavy',
      selection: 'selection',
      success: 'success',
      warning: 'warning',
      error: 'error',
    },
  };
});

// Logger mock - deterministic mock matching actual logger implementation
// Removed all 'any' types for type safety
interface MockLogger {
  warn: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  setLevel: ReturnType<typeof vi.fn>;
  addHandler: ReturnType<typeof vi.fn>;
}

vi.mock('@/lib/logger', () => {
  const createMockLogger = (): MockLogger => {
    return {
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      setLevel: vi.fn(),
      addHandler: vi.fn(),
    };
  };

  const mockLoggerInstance = createMockLogger();

  return {
    createLogger: vi.fn((_context?: string): MockLogger => {
      return createMockLogger();
    }),
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
    default: mockLoggerInstance,
  };
});

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
  default: {
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
    AccessibilityInfo: {
      isReduceMotionEnabled: vi.fn(() => Promise.resolve(false)),
      addEventListener: vi.fn(() => ({ remove: vi.fn() })),
    },
  },
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
  AccessibilityInfo: {
    isReduceMotionEnabled: vi.fn(() => Promise.resolve(false)),
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
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
      sin: (t: number) => Math.sin((t * Math.PI) / 2),
      circle: (t: number) => 1 - Math.sqrt(1 - t * t),
      exp: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
      back:
        (s = 1.70158) =>
        (t: number) =>
          t * t * ((s + 1) * t - s),
      bounce: (t: number) => t,
      elastic: (bounciness?: number) => (t: number) => t,
      bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => t,
      in: (easing: (t: number) => number) => easing,
      out: (easing: (t: number) => number) => easing,
      inOut: (easing: (t: number) => number) => easing,
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
// This ensures all tests have proper isolation and no state leaks between tests
afterEach(() => {
  // Reset haptics mock state
  hapticsCallCounter = 0;
  hapticsCalls.length = 0;

  // Reset analytics mock state (if analytics mock is used)
  // Note: Analytics mock is created per test, but we clear any global state here
  if (
    typeof window !== 'undefined' &&
    (window as typeof window & { __analyticsEvents?: unknown[] }).__analyticsEvents
  ) {
    (window as typeof window & { __analyticsEvents: unknown[] }).__analyticsEvents.length = 0;
  }

  // Reset QueryClient mock state
  // QueryClient mocks are created per test, but we ensure no global state persists

  // Reset browser API mocks
  // IntersectionObserver and ResizeObserver callbacks are reset by cleanupTestState
  // but we ensure no global state persists

  cleanupTestState();
  resetAllMocks();

  // Ensure fake timers are used by default for deterministic tests
  // Individual tests can opt out by calling vi.useRealTimers() if needed
  if (!vi.isFakeTimers()) {
    vi.useFakeTimers();
  }
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
        const touchesArray = eventInitDict?.touches! || [];
        const targetTouchesArray = eventInitDict?.targetTouches! || [];
        const changedTouchesArray = eventInitDict?.changedTouches! || [];

        // Create TouchList objects
        const createTouchList = (touches: Touch[]): TouchList => {
          const list = touches as unknown as TouchList;
          list.item = (index: number) => touches[index] || null;
          return list;
        };

        this.touches = createTouchList(touchesArray);
        this.targetTouches = createTouchList(targetTouchesArray);
        this.changedTouches = createTouchList(changedTouchesArray);
        this.altKey = eventInitDict?.altKey ?? false;
        this.metaKey = eventInitDict?.metaKey ?? false;
        this.ctrlKey = eventInitDict?.ctrlKey ?? false;
        this.shiftKey = eventInitDict?.shiftKey ?? false;
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

// Pointer capture polyfills for jsdom (needed for Radix UI Slider)
if (typeof Element !== 'undefined') {
  const originalElement = Element.prototype;
  if (!originalElement.hasPointerCapture) {
    const pointerCaptureMap = new WeakMap<Element, Set<number>>();
    originalElement.hasPointerCapture = function (pointerId: number): boolean {
      const captures = pointerCaptureMap.get(this);
      return captures?.has(pointerId) ?? false;
    };
    originalElement.setPointerCapture = function (pointerId: number): void {
      if (!pointerCaptureMap.has(this)) {
        pointerCaptureMap.set(this, new Set());
      }
      pointerCaptureMap.get(this)!.add(pointerId);
    };
    originalElement.releasePointerCapture = function (pointerId: number): void {
      const captures = pointerCaptureMap.get(this);
      captures?.delete(pointerId);
    };
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

// Mock API Client - deterministic mock with configurable behavior
// For integration tests that need real HTTP, use vi.unmock('@/lib/api-client') in the test file
vi.mock('@/lib/api-client', async () => {
  // Check if we should use the real implementation (for integration tests)
  // Tests can set process.env.USE_REAL_API_CLIENT = 'true' to use real client
  if (process.env.USE_REAL_API_CLIENT === 'true') {
    return await vi.importActual('@/lib/api-client');
  }

  const { createMockAPIClient } = await import('./mocks/api-client');
  // Create deterministic mock with no delay and 100% success rate by default
  const mockClient = createMockAPIClient({
    delay: 0,
    successRate: 1.0,
    defaultResponse: {},
  });
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

// Mock UI Context - use actual implementation to allow proper testing
// Tests that need UIProvider should wrap components with it
// Tests that don't need it can use vi.unmock if needed
vi.mock('@/contexts/UIContext', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/UIContext')>('@/contexts/UIContext');

  // Use actual implementation - tests should wrap with UIProvider when needed
  return actual;
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

  // MotionView component for use in components
  const MotionView = ({
    children,
    style,
    initial,
    animate,
    transition,
    ...props
  }: {
    children?: React.ReactNode;
    style?: Record<string, unknown>;
    initial?: Record<string, unknown>;
    animate?: Record<string, unknown>;
    transition?: Record<string, unknown>;
    [key: string]: unknown;
  }) => {
    return React.createElement('div', { style, ...props }, children);
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
    MotionView,
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
    useReducedMotion: vi.fn(() => false),
    useReducedMotionSV: vi.fn(() => createMockSharedValue(0)),
    isReduceMotionEnabled: vi.fn(() => false),
    getReducedMotionDuration: vi.fn((duration: number) => duration),
    getReducedMotionMultiplier: vi.fn(() => 1),
    usePerfBudget: vi.fn(() => ({ withinBudget: true, frameTime: 16 })),
    haptic: {
      trigger: vi.fn(),
      light: vi.fn(),
      medium: vi.fn(),
      heavy: vi.fn(),
      selection: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      impact: vi.fn(),
      notification: vi.fn(),
    },
    usePageTransitions: vi.fn(() => ({
      transition: {},
      animatedStyle: {},
    })),
    usePressBounce: vi.fn((scaleOnPress = 0.96, scaleOnRelease = 1) => ({
      onPressIn: vi.fn(),
      onPressOut: vi.fn(),
      animatedStyle: { transform: [{ scale: scaleOnRelease }] },
    })),
    useOverlayTransition: vi.fn(
      (options: UseOverlayTransitionOptions): UseOverlayTransitionReturn => {
        const isOpen = options.isOpen;
        const type = options.type ?? 'modal';
        const drawerSide = options.drawerSide ?? 'right';

        // Backdrop variants (same for all types)
        const backdropVariants = {
          initial: { opacity: 0 },
          animate: { opacity: isOpen ? 1 : 0 },
          exit: { opacity: 0 },
        };

        // Content variants based on type
        let contentVariants: Record<string, Record<string, number | string>>;

        if (type === 'drawer') {
          const translateKey = drawerSide === 'left' || drawerSide === 'right' ? 'x' : 'y';
          const translateValue = drawerSide === 'left' || drawerSide === 'top' ? -100 : 100;
          contentVariants = {
            initial: { [translateKey]: translateValue, opacity: 0 },
            animate: { [translateKey]: isOpen ? 0 : translateValue, opacity: isOpen ? 1 : 0 },
            exit: { [translateKey]: translateValue, opacity: 0 },
          };
        } else if (type === 'sheet') {
          contentVariants = {
            initial: { y: '100%', opacity: 0 },
            animate: { y: isOpen ? 0 : '100%', opacity: isOpen ? 1 : 0 },
            exit: { y: '100%', opacity: 0 },
          };
        } else {
          // modal (default)
          contentVariants = {
            initial: { opacity: 0, scale: 0.95, y: 20 },
            animate: {
              opacity: isOpen ? 1 : 0,
              scale: isOpen ? 1 : 0.95,
              y: isOpen ? 0 : 20,
            },
            exit: { opacity: 0, scale: 0.95, y: 20 },
          };
        }

        return {
          backdropProps: {
            initial: 'initial',
            animate: isOpen ? 'animate' : 'exit',
            exit: 'exit',
            variants: backdropVariants,
            transition: { duration: 0.2 },
          },
          contentProps: {
            initial: 'initial',
            animate: isOpen ? 'animate' : 'exit',
            exit: 'exit',
            variants: contentVariants,
            transition: { type: 'spring', stiffness: 300, damping: 30 },
          },
        };
      }
    ),
    animate: vi.fn((value: unknown, keyframes: unknown, options?: unknown) => {
      return Promise.resolve(value);
    }),
  };
});

// Mock @/effects/reanimated/animated-view
vi.mock('@/effects/reanimated/animated-view', () => {
  const AnimatedView = ({
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

// Mock React Native NativeModules and NativeEventEmitter
vi.mock('react-native', () => ({
  NativeModules: {
    KycModule: {
      initialize: vi.fn(() => Promise.resolve()),
      startVerification: vi.fn(() => Promise.resolve({ success: true })),
      getVerificationStatus: vi.fn(() => Promise.resolve({ status: 'pending' })),
      addListener: vi.fn(),
      removeListeners: vi.fn(),
    },
  },
  NativeEventEmitter: vi.fn(() => ({
    addListener: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
  })),
  Platform: {
    OS: 'web',
    select: vi.fn((obj: Record<string, unknown>) => obj.web || obj.default),
  },
  requireNativeComponent: vi.fn(() => {
    return ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children);
  }),
}));
