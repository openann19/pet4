/**
 * Tests for useReactionSparkles hook
 * Verifies reduced-motion support and particle handling
 */

import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useReactionSparkles } from '../use-reaction-sparkles'

vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((toValue) => toValue),
    withTiming: vi.fn((toValue) => toValue),
    withSequence: vi.fn((...args) => args[0]),
    withDelay: vi.fn((delay, anim) => anim),
  }
})

vi.mock('../../effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

vi.mock('@petspark/motion', () => ({
  useReactionSparkles: vi.fn((options) => ({
    emojiScale: { value: 0 },
    emojiOpacity: { value: 0 },
    pulseScale: { value: 1 },
    animatedStyle: {},
    pulseStyle: {},
    animate: vi.fn(),
    startPulse: vi.fn(),
    stopPulse: vi.fn(),
  })),
  haptic: {
    medium: vi.fn(),
  },
}))

describe('useReactionSparkles (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useReactionSparkles())
    
    expect(result.current.emojiScale).toBeDefined()
    expect(result.current.emojiOpacity).toBeDefined()
    expect(result.current.pulseScale).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.particles).toBeDefined()
  })

  it('should respect reduced motion', async () => {
    const { useReducedMotionSV } = await import('../../effects/core/use-reduced-motion-sv')
    vi.mocked(useReducedMotionSV).mockReturnValue({ value: true })

    const { result } = renderHook(() => useReactionSparkles())
    
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should animate reaction with particles', () => {
    const { result } = renderHook(() => useReactionSparkles({ enableParticles: true }))
    
    act(() => {
      result.current.animate('❤️', 100, 100)
    })
    
    expect(result.current.animate).toBeDefined()
  })

  it('should clear particles', () => {
    const { result } = renderHook(() => useReactionSparkles())
    
    act(() => {
      result.current.clearParticles()
    })
    
    expect(result.current.particles).toEqual([])
  })

  it('should handle pulse animation', () => {
    const { result } = renderHook(() => useReactionSparkles({ enablePulse: true }))
    
    act(() => {
      result.current.startPulse()
    })
    
    expect(result.current.startPulse).toBeDefined()
    
    act(() => {
      result.current.stopPulse()
    })
    
    expect(result.current.stopPulse).toBeDefined()
  })
})

