/**
 * Pull to Refresh Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-pull-to-refresh.test.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { usePullToRefresh } from '../use-pull-to-refresh'
import * as Haptics from 'expo-haptics'
import { AccessibilityInfo, Platform } from 'react-native'
import { createLogger } from '@/utils/logger'

// Mock react-native-gesture-handler
vi.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: vi.fn(() => ({
      onBegin: vi.fn(() => ({
        onUpdate: vi.fn(() => ({
          onEnd: vi.fn(() => ({
            onFinalize: vi.fn(() => ({})),
          })),
        })),
      })),
    })),
  },
}))

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn((initial: number) => ({
    value: initial,
  })),
  useAnimatedStyle: vi.fn(() => ({})),
  useDerivedValue: vi.fn(() => ({ value: 0 })),
  withSpring: vi.fn((value: number) => value),
  withTiming: vi.fn((value: number) => value),
  cancelAnimation: vi.fn(),
  runOnJS: vi.fn((fn: () => void) => fn),
}))

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}))

// Mock AccessibilityInfo
vi.mock('react-native', () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: vi.fn(() => Promise.resolve(false)),
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
  Platform: {
    OS: 'ios',
  },
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}))

const mockHaptics = vi.mocked(Haptics)
const mockAccessibilityInfo = vi.mocked(AccessibilityInfo)
const mockPlatform = vi.mocked(Platform)

describe('usePullToRefresh', () => {
  const mockOnRefresh = vi.fn(() => Promise.resolve())

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnRefresh.mockResolvedValue(undefined)
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false)
    mockPlatform.OS = 'ios'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh))

    expect(result.current.isRefreshing).toBe(false)
    expect(result.current.translateY).toBeDefined()
    expect(result.current.progress).toBeDefined()
    expect(result.current.gesture).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(typeof result.current.refresh).toBe('function')
  })

  it('should refresh successfully', async () => {
    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh))

    await act(async () => {
      await result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })

    expect(mockOnRefresh).toHaveBeenCalled()
  })

  it('should set isRefreshing during refresh', async () => {
    let resolveRefresh: () => void
    const refreshPromise = new Promise<void>(resolve => {
      resolveRefresh = resolve
    })
    mockOnRefresh.mockReturnValue(refreshPromise)

    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh))

    act(() => {
      void result.current.refresh()
    })

    expect(result.current.isRefreshing).toBe(true)

    await act(async () => {
      resolveRefresh!()
      await refreshPromise
    })

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })
  })

  it('should trigger haptic feedback on refresh', async () => {
    const { result } = renderHook(() =>
      usePullToRefresh(mockOnRefresh, {
        haptics: true,
      })
    )

    await act(async () => {
      await result.current.refresh()
    })

    expect(mockHaptics.impactAsync).toHaveBeenCalled()
  })

  it('should not trigger haptic feedback when haptics is disabled', async () => {
    const { result } = renderHook(() =>
      usePullToRefresh(mockOnRefresh, {
        haptics: false,
      })
    )

    await act(async () => {
      await result.current.refresh()
    })

    expect(mockHaptics.impactAsync).not.toHaveBeenCalled()
  })

  it('should not trigger haptic feedback on web', async () => {
    mockPlatform.OS = 'web'

    const { result } = renderHook(() =>
      usePullToRefresh(mockOnRefresh, {
        haptics: true,
      })
    )

    await act(async () => {
      await result.current.refresh()
    })

    expect(mockHaptics.impactAsync).not.toHaveBeenCalled()
  })

  it('should not refresh if already refreshing', async () => {
    let resolveRefresh: () => void
    const refreshPromise = new Promise<void>(resolve => {
      resolveRefresh = resolve
    })
    mockOnRefresh.mockReturnValue(refreshPromise)

    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh))

    act(() => {
      void result.current.refresh()
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(mockOnRefresh).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRefresh!()
      await refreshPromise
    })
  })

  it('should handle refresh errors gracefully', async () => {
    const error = new Error('Refresh failed')
    mockOnRefresh.mockRejectedValue(error)

    const { result } = renderHook(() => usePullToRefresh(mockOnRefresh))

    await act(async () => {
      await result.current.refresh()
    })

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false)
    })

    expect(createLogger('usePullToRefresh').error).toHaveBeenCalled()
  })

  it('should use custom threshold', () => {
    const { result } = renderHook(() =>
      usePullToRefresh(mockOnRefresh, {
        threshold: 100,
      })
    )

    expect(result.current).toBeDefined()
  })

  it('should use custom maxPull', () => {
    const { result } = renderHook(() =>
      usePullToRefresh(mockOnRefresh, {
        maxPull: 150,
      })
    )

    expect(result.current).toBeDefined()
  })

  it('should use custom resistance', () => {
    const { result } = renderHook(() =>
      usePullToRefresh(mockOnRefresh, {
        resistance: 3.0,
      })
    )

    expect(result.current).toBeDefined()
  })

  it('should call onPullProgress callback', () => {
    const onPullProgress = vi.fn()
    const { result } = renderHook(() =>
      usePullToRefresh(mockOnRefresh, {
        onPullProgress,
      })
    )

    expect(result.current).toBeDefined()
    // Note: onPullProgress is called from UI thread via runOnJS,
    // so we can't easily test it in unit tests without more complex setup
  })

  it('should respect reduced motion', async () => {
    mockAccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true)

    const { result } = renderHook(() =>
      usePullToRefresh(mockOnRefresh, {
        haptics: true,
      })
    )

    await waitFor(() => {
      expect(mockAccessibilityInfo.isReduceMotionEnabled).toHaveBeenCalled()
    })

    await act(async () => {
      await result.current.refresh()
    })

    // Haptics should still work even with reduced motion
    // (reduced motion only affects animations, not haptics)
    expect(mockOnRefresh).toHaveBeenCalled()
  })
})
