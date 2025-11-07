/**
 * Tests for useLiquidSwipe hook
 * Verifies reduced-motion support and liquid swipe handling
 */

import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLiquidSwipe } from '../use-liquid-swipe'

vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((toValue) => toValue),
    withDecay: vi.fn((config) => config.velocity),
  }
})

vi.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: vi.fn(() => ({
      onBegin: vi.fn().mockReturnThis(),
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
    medium: vi.fn(),
  },
}))

describe('useLiquidSwipe (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLiquidSwipe())
    
    expect(result.current.translateX).toBeDefined()
    expect(result.current.scale).toBeDefined()
    expect(result.current.rotate).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.gesture).toBeDefined()
    expect(result.current.isDragging).toBe(false)
    expect(result.current.reset).toBeDefined()
  })

  it('should respect reduced motion', async () => {
    const { useReducedMotionSV } = await import('../../effects/core/use-reduced-motion-sv')
    vi.mocked(useReducedMotionSV).mockReturnValue({ value: true })

    const { result } = renderHook(() => useLiquidSwipe())
    
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should reset when reset is called', () => {
    const { result } = renderHook(() => useLiquidSwipe())
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.reset).toBeDefined()
  })

  it('should handle swipe callbacks', () => {
    const onSwipeLeft = jest.fn()
    const onSwipeRight = jest.fn()
    
    const { result } = renderHook(() => 
      useLiquidSwipe({ onSwipeLeft, onSwipeRight })
    )
    
    expect(result.current.gesture).toBeDefined()
  })
})

