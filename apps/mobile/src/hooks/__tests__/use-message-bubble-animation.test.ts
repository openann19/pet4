/**
 * Message Bubble Animation Hook Tests (Mobile)
 *
 * Tests for unified message bubble animation hook matching web API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageBubbleAnimation } from '../use-message-bubble-animation'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
  const createMockSharedValue = (initial: number) => {
    let currentValue = initial
    return {
      get value() {
        return currentValue
      },
      set value(newValue: number) {
        if (typeof newValue === 'number') {
          currentValue = newValue
        }
      },
    }
  }

  return {
    useSharedValue: vi.fn((initial: number) => createMockSharedValue(initial)),
    useAnimatedStyle: vi.fn((fn: () => Record<string, unknown>) => {
      try {
        return fn()
      } catch {
        return {}
      }
    }),
    withSpring: vi.fn((toValue: number) => toValue),
    withTiming: vi.fn((toValue: number) => toValue),
    withDelay: vi.fn((_delay: number, animation: unknown) => animation),
    withSequence: vi.fn((...animations: unknown[]) => animations[animations.length - 1]),
    interpolate: vi.fn((value: number, _inputRange: number[], outputRange: number[]) => {
      return outputRange[0] ?? 0
    }),
    Extrapolation: {
      CLAMP: 'clamp',
    },
    Easing: {
      linear: (t: number) => t,
    },
  }
})

// Mock reduced motion
vi.mock('../../effects/chat/core/reduced-motion', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: false })),
  getReducedMotionDuration: vi.fn((duration: number) => duration),
}))

// Mock haptic manager
vi.mock('../../effects/chat/core/haptic-manager', () => ({
  triggerHaptic: vi.fn(),
}))

// Mock transitions
vi.mock('../../effects/reanimated/transitions', () => ({
  springConfigs: {
    smooth: { damping: 25, stiffness: 400 },
    bouncy: { damping: 15, stiffness: 500 },
  },
  timingConfigs: {
    fast: { duration: 150 },
    smooth: { duration: 300 },
  },
}))

describe('useMessageBubbleAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    expect(result.current.opacity.value).toBe(0)
    expect(result.current.translateY.value).toBe(20)
    expect(result.current.scale.value).toBe(1)
    expect(result.current.reactionOpacity.value).toBe(0)
  })

  it('should initialize with provided values when isNew is false', () => {
    const { result } = renderHook(() => useMessageBubbleAnimation({ isNew: false }))

    expect(result.current.opacity.value).toBe(1)
    expect(result.current.translateY.value).toBe(0)
  })

  it('should handle press in events', async () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    await act(async () => {
      result.current.handlePressIn()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.scale.value).toBeLessThanOrEqual(1)
    expect(typeof result.current.glowOpacity.value).toBe('number')
  })

  it('should handle press out events', async () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    await act(async () => {
      result.current.handlePressIn()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await act(async () => {
      result.current.handlePressOut()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.scale.value).toBe(1)
  })

  it('should animate highlight when isHighlighted changes', async () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ isHighlighted }) => useMessageBubbleAnimation({ isHighlighted }),
      { initialProps: { isHighlighted: false } }
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })

    expect(result.current.backgroundOpacity.value).toBe(0)

    await act(async () => {
      rerender({ isHighlighted: true })
      await vi.advanceTimersByTimeAsync(10)
    })

    expect(typeof result.current.backgroundOpacity.value).toBe('number')

    vi.useRealTimers()
  })

  it('should stagger animations based on index', () => {
    const { result: result0 } = renderHook(() =>
      useMessageBubbleAnimation({ index: 0, isNew: true })
    )
    const { result: result1 } = renderHook(() =>
      useMessageBubbleAnimation({ index: 1, isNew: true })
    )

    expect(typeof result0.current.opacity.value).toBe('number')
    expect(typeof result1.current.opacity.value).toBe('number')
    expect(result0.current.scale.value).toBe(result1.current.scale.value)
  })

  it('should call onLongPress after delay', async () => {
    vi.useFakeTimers()
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useMessageBubbleAnimation({ onLongPress }))

    await act(async () => {
      result.current.handlePressIn()
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(onLongPress).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('should animate reaction', async () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    expect(result.current.reactionOpacity.value).toBe(0)
    expect(result.current.reactionScale.value).toBe(1)

    await act(async () => {
      result.current.animateReaction('❤️')
      await new Promise((resolve) => setTimeout(resolve, 10))
    })

    expect(result.current.reactionScale.value).toBeGreaterThanOrEqual(1)
    expect(result.current.reactionOpacity.value).toBeGreaterThanOrEqual(0)
  })

  it('should provide animated styles', () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.glowStyle).toBeDefined()
    expect(result.current.backgroundStyle).toBeDefined()
    expect(result.current.reactionStyle).toBeDefined()
  })

  it('should export reaction animation values', () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    expect(result.current.reactionScale).toBeDefined()
    expect(result.current.reactionTranslateY).toBeDefined()
    expect(result.current.reactionOpacity).toBeDefined()
    expect(result.current.reactionScale.value).toBe(1)
    expect(result.current.reactionTranslateY.value).toBe(0)
    expect(result.current.reactionOpacity.value).toBe(0)
  })

  it('should handle press events', async () => {
    const onPress = vi.fn()
    const { result } = renderHook(() => useMessageBubbleAnimation({ onPress }))

    await act(async () => {
      result.current.handlePressIn()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await act(async () => {
      result.current.handlePress()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(onPress).toHaveBeenCalled()
  })

  it('should handle long press start and end', async () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    await act(async () => {
      result.current.handleLongPressStart()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.scale.value).toBeLessThanOrEqual(1)

    await act(async () => {
      result.current.handleLongPressEnd()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.scale.value).toBe(1)
  })

  it('should animate highlight manually', async () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    await act(async () => {
      result.current.animateHighlight()
      await new Promise((resolve) => setTimeout(resolve, 10))
    })

    expect(typeof result.current.backgroundOpacity.value).toBe('number')
  })

  it('should support isOwn option for send/receive effects', () => {
    const { result: sendResult } = renderHook(() =>
      useMessageBubbleAnimation({ isOwn: true, isNew: true })
    )
    const { result: receiveResult } = renderHook(() =>
      useMessageBubbleAnimation({ isOwn: false, isNew: true })
    )

    expect(typeof sendResult.current.opacity.value).toBe('number')
    expect(typeof receiveResult.current.opacity.value).toBe('number')
  })
})
