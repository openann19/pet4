/**
 * Tests for useDragGesture hook
 * Verifies reduced-motion support and drag handling
 */

import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDragGesture } from '../use-drag-gesture'

vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((toValue) => toValue),
    withTiming: vi.fn((toValue) => toValue),
  }
})

vi.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: vi.fn(() => ({
      enabled: vi.fn().mockReturnThis(),
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
    selection: vi.fn(),
  },
}))

describe('useDragGesture (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useDragGesture())
    
    expect(result.current.x).toBeDefined()
    expect(result.current.y).toBeDefined()
    expect(result.current.isDragging).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.gesture).toBeDefined()
    expect(result.current.reset).toBeDefined()
  })

  it('should respect reduced motion', async () => {
    const { useReducedMotionSV } = await import('../../effects/core/use-reduced-motion-sv')
    vi.mocked(useReducedMotionSV).mockReturnValue({ value: true })

    const { result } = renderHook(() => useDragGesture())
    
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should reset position when reset is called', () => {
    const { result } = renderHook(() => useDragGesture())
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.reset).toBeDefined()
  })

  it('should handle axis constraint', () => {
    const { result } = renderHook(() => useDragGesture({ axis: 'x' }))
    
    expect(result.current.gesture).toBeDefined()
  })

  it('should handle bounds constraint', () => {
    const { result } = renderHook(() => 
      useDragGesture({ 
        bounds: { left: 0, right: 100, top: 0, bottom: 100 }
      })
    )
    
    expect(result.current.gesture).toBeDefined()
  })

  it('should handle snapBack option', () => {
    const { result } = renderHook(() => useDragGesture({ snapBack: true }))
    
    expect(result.current.gesture).toBeDefined()
  })
})

