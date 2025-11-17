import { renderHook, act } from '@testing-library/react-native'
import { useFloatingParticle } from './use-floating-particle'

// Mock Reanimated and native modules
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn((initial) => ({
    value: initial,
  })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((toValue) => toValue),
  withTiming: jest.fn((toValue) => toValue),
  cancelAnimation: jest.fn(),
}))

jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
}))

jest.mock('@petspark/motion', () => ({
  useFloatingParticle: jest.fn((options) => ({
    style: {},
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    isAnimating: false,
  })),
}))

describe('useFloatingParticle (Mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default mobile-specific values', () => {
    const { result } = renderHook(() => useFloatingParticle())
    
    expect(result.current.style).toBeDefined()
    expect(result.current.start).toBeDefined()
    expect(result.current.stop).toBeDefined()
    expect(result.current.reset).toBeDefined()
    expect(result.current.isAnimating).toBe(false)
  })

  it('should handle screen-relative positioning', () => {
    const { result } = renderHook(() => 
      useFloatingParticle({
        screenRelative: true,
        initialX: 0.5,
        initialY: 0.5,
      })
    )
    
    expect(result.current.style).toBeDefined()
  })

  it('should handle absolute positioning', () => {
    const { result } = renderHook(() => 
      useFloatingParticle({
        screenRelative: false,
        initialX: 100,
        initialY: 200,
        width: 300,
        height: 400,
      })
    )
    
    expect(result.current.style).toBeDefined()
  })

  it('should start animation when calling start()', () => {
    const { result } = renderHook(() => useFloatingParticle())
    
    act(() => {
      result.current.start()
    })
    
    expect(result.current.start).toHaveBeenCalled()
  })

  it('should stop animation when calling stop()', () => {
    const { result } = renderHook(() => useFloatingParticle())
    
    act(() => {
      result.current.stop()
    })
    
    expect(result.current.stop).toHaveBeenCalled()
  })

  it('should use mobile-specific defaults', () => {
    const mockUseFloatingParticle = require('@petspark/motion').useFloatingParticle
    
    renderHook(() => useFloatingParticle())
    
    expect(mockUseFloatingParticle).toHaveBeenCalledWith(
      expect.objectContaining({
        floatDuration: 1500, // Mobile-specific faster duration
        fadeOut: true,
        enableScale: true,
      })
    )
  })
})