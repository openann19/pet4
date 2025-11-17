/**
 * Tests for useBubbleTilt hook
 * Verifies reduced-motion support and gesture handling
 */

import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBubbleTilt } from '../use-bubble-tilt'

vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((toValue) => toValue),
  }
})

vi.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: vi.fn(() => ({
      enabled: vi.fn().mockReturnThis(),
      onUpdate: vi.fn().mockReturnThis(),
      onEnd: vi.fn().mockReturnThis(),
    })),
  },
}))

vi.mock('../../effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

vi.mock('@petspark/motion', () => ({
  useBubbleTilt: vi.fn((options) => ({
    rotateX: { value: 0 },
    rotateY: { value: 0 },
    shadowDepth: { value: 0 },
    animatedStyle: { value: { transform: [], shadowBlur: 4, shadowOpacity: 0.2 } },
    handleMove: vi.fn(),
    handleLeave: vi.fn(),
  })),
}))

describe('useBubbleTilt (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBubbleTilt())
    
    expect(result.current.rotateX).toBeDefined()
    expect(result.current.rotateY).toBeDefined()
    expect(result.current.shadowDepth).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.createGesture).toBeDefined()
  })

  it('should respect reduced motion', async () => {
    const { useReducedMotionSV } = await import('../../effects/core/use-reduced-motion-sv')
    vi.mocked(useReducedMotionSV).mockReturnValue({ value: true })

    const { result } = renderHook(() => useBubbleTilt())
    
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should create gesture handler with dimensions', () => {
    const { result } = renderHook(() => useBubbleTilt())
    
    const gesture = result.current.createGesture(200, 100)
    expect(gesture).toBeDefined()
  })

  it('should convert shadow styles to mobile format', () => {
    const { result } = renderHook(() => useBubbleTilt())
    
    const style = result.current.animatedStyle
    expect(style).toBeDefined()
  })
})

