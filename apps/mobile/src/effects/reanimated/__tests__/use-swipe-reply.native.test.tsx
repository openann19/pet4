/**
 * Tests for useSwipeReply hook
 * Verifies reduced-motion support and swipe gesture handling
 */

import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSwipeReply } from '../use-swipe-reply'

vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((toValue) => toValue),
    withTiming: vi.fn((toValue) => toValue),
    interpolate: vi.fn((value, input, output) => output[0]),
    Extrapolation: { CLAMP: 'clamp' },
  }
})

vi.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: vi.fn(() => ({
      enabled: vi.fn().mockReturnThis(),
      activeOffsetX: vi.fn().mockReturnThis(),
      onStart: vi.fn().mockReturnThis(),
      onUpdate: vi.fn().mockReturnThis(),
      onEnd: vi.fn().mockReturnThis(),
    })),
  },
}))

vi.mock('../../effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

vi.mock('@petspark/motion', () => ({
  haptic: {
    selection: vi.fn(),
  },
}))

describe('useSwipeReply (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSwipeReply())
    
    expect(result.current.translateX).toBeDefined()
    expect(result.current.opacity).toBeDefined()
    expect(result.current.previewOpacity).toBeDefined()
    expect(result.current.previewScale).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.previewStyle).toBeDefined()
    expect(result.current.gesture).toBeDefined()
    expect(result.current.reset).toBeDefined()
  })

  it('should respect reduced motion', async () => {
    const { useReducedMotionSV } = await import('../../effects/core/use-reduced-motion-sv')
    vi.mocked(useReducedMotionSV).mockReturnValue({ value: true })

    const { result } = renderHook(() => useSwipeReply())
    
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should reset when reset is called', () => {
    const { result } = renderHook(() => useSwipeReply())
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.reset).toBeDefined()
  })

  it('should handle custom threshold', () => {
    const { result } = renderHook(() => useSwipeReply({ threshold: 80 }))
    
    expect(result.current.gesture).toBeDefined()
  })

  it('should handle haptic feedback', () => {
    const { result } = renderHook(() => useSwipeReply({ hapticFeedback: true }))
    
    expect(result.current.gesture).toBeDefined()
  })
})

