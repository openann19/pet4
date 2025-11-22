import { vi } from 'vitest';
import React from 'react';

/**
 * React Native mocks for web testing
 */
export function setupReactNativeMocks(): void {
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
      select: vi.fn((obj: Record<string, unknown>) => obj.web || obj.default),
    },
    AccessibilityInfo: {
      isReduceMotionEnabled: vi.fn(() => Promise.resolve(false)),
      addEventListener: vi.fn(() => ({ remove: vi.fn() })),
    },
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
    requireNativeComponent: vi.fn(() => {
      return ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
        React.createElement('div', props, children);
    }),
  }));

  vi.mock('react-native-safe-area-context', () => ({
    SafeAreaView: 'div',
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  }));

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
}

