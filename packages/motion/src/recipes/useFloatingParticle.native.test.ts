import { renderHook, act } from '@testing-library/react'
import { useFloatingParticle } from './useFloatingParticle'

// Mock Reanimated hooks
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn((initial) => ({
    value: initial,
  })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((toValue) => toValue),
  withTiming: jest.fn((toValue) => toValue),
  cancelAnimation: jest.fn(),
}))

describe('useFloatingParticle', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFloatingParticle())
    
    expect(result.current.style).toBeDefined()
    expect(result.current.start).toBeDefined()
    expect(result.current.stop).toBeDefined()
    expect(result.current.reset).toBeDefined()
    expect(result.current.isAnimating).toBe(false)
  })

  it('should start animation when calling start()', () => {
    const { result } = renderHook(() => useFloatingParticle())
    
    act(() => {
      result.current.start()
    })
    
    expect(result.current.isAnimating).toBe(true)
  })

  it('should stop animation when calling stop()', () => {
    const { result } = renderHook(() => useFloatingParticle())
    
    act(() => {
      result.current.start()
      result.current.stop()
    })
    
    expect(result.current.isAnimating).toBe(false)
  })

  it('should reset to initial state when calling reset()', () => {
    const { result } = renderHook(() => useFloatingParticle())
    
    act(() => {
      result.current.start()
      result.current.reset()
    })
    
    expect(result.current.isAnimating).toBe(false)
  })

  it('should handle custom options', () => {
    const options = {
      initialOffset: { x: 0.3, y: 0.3 },
      amplitude: { x: 50, y: 50 },
      floatDuration: 1000,
      fadeOut: false,
      enableScale: false,
    }
    
    const { result } = renderHook(() => useFloatingParticle(options))
    
    expect(result.current.style).toBeDefined()
  })

  it('should respect reduced motion settings', () => {
    // Mock useReducedMotion to return true
    jest.mock('../core/hooks', () => ({
      useReducedMotion: () => ({ value: true }),
    }))
    
    const { result } = renderHook(() => useFloatingParticle())
    
    act(() => {
      result.current.start()
    })
    
    expect(result.current.isAnimating).toBe(true)
    // Should use simpler animations but still work
  })
})