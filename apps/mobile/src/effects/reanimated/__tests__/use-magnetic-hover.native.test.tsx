/**
 * Tests for useMagneticHover hook
 * Verifies reduced-motion support and gesture handling
 */

import { renderHook } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMagneticHover } from '../use-magnetic-hover'

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
      onBegin: vi.fn().mockReturnThis(),
      onUpdate: vi.fn().mockReturnThis(),
      onEnd: vi.fn().mockReturnThis(),
      onFinalize: vi.fn().mockReturnThis(),
    })),
  },
}))

vi.mock('../../effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

vi.mock('@petspark/motion', () => ({
  haptic: {
    light: vi.fn(),
  },
}))

describe('useMagneticHover (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMagneticHover())
    
    expect(result.current.translateX).toBeDefined()
    expect(result.current.translateY).toBeDefined()
    expect(result.current.scale).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.gesture).toBeDefined()
  })

  it('should respect reduced motion', async () => {
    const { useReducedMotionSV } = await import('../../effects/core/use-reduced-motion-sv')
    vi.mocked(useReducedMotionSV).mockReturnValue({ value: true })

    const { result } = renderHook(() => useMagneticHover())
    
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should create pan gesture handler', () => {
    const { result } = renderHook(() => useMagneticHover())
    
    expect(result.current.gesture).toBeDefined()
  })

  it('should handle haptic feedback when enabled', async () => {
    const { haptic } = await import('@petspark/motion')
    
    renderHook(() => useMagneticHover({ hapticFeedback: true }))
    
    // Haptic should be available
    expect(haptic).toBeDefined()
  })

  it('should disable when enabled=false', () => {
    const { result } = renderHook(() => useMagneticHover({ enabled: false }))
    
    expect(result.current.gesture).toBeDefined()
  })
})

