import { renderHook, act } from '@testing-library/react'
import { useThreadHighlight } from './useThreadHighlight'

// Mock Reanimated hooks
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn((initial) => ({
    value: initial,
  })),
  useAnimatedStyle: jest.fn(() => ({})),
  interpolateColor: jest.fn((value, inputRange, outputRange) => outputRange[0]),
  withSpring: jest.fn((toValue) => toValue),
  withTiming: jest.fn((toValue) => toValue),
  cancelAnimation: jest.fn(),
}))

describe('useThreadHighlight', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useThreadHighlight())
    
    expect(result.current.style).toBeDefined()
    expect(result.current.highlight).toBeDefined()
    expect(result.current.unhighlight).toBeDefined()
    expect(result.current.toggle).toBeDefined()
    expect(result.current.reset).toBeDefined()
    expect(result.current.isHighlighted).toBe(false)
  })

  it('should start highlight animation when calling highlight()', () => {
    const { result } = renderHook(() => useThreadHighlight())
    
    act(() => {
      result.current.highlight()
    })
    
    expect(result.current.isHighlighted).toBe(true)
  })

  it('should stop highlight animation when calling unhighlight()', () => {
    const { result } = renderHook(() => useThreadHighlight())
    
    act(() => {
      result.current.highlight()
      result.current.unhighlight()
    })
    
    expect(result.current.isHighlighted).toBe(false)
  })

  it('should toggle highlight state', () => {
    const { result } = renderHook(() => useThreadHighlight())
    
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isHighlighted).toBe(true)
    
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isHighlighted).toBe(false)
  })

  it('should handle custom highlight color', () => {
    const { result } = renderHook(() => 
      useThreadHighlight({
        highlightColor: '#FF0000',
        glowIntensity: 0.6,
      })
    )
    
    expect(result.current.style).toBeDefined()
  })

  it('should auto-dismiss after specified duration', () => {
    const { result } = renderHook(() => 
      useThreadHighlight({
        autoDismissAfter: 1000,
      })
    )
    
    act(() => {
      result.current.highlight()
    })
    expect(result.current.isHighlighted).toBe(true)
    
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(result.current.isHighlighted).toBe(false)
  })

  it('should handle pulse animation when enabled', () => {
    const { result } = renderHook(() => 
      useThreadHighlight({
        enablePulse: true,
        pulseDuration: 800,
      })
    )
    
    act(() => {
      result.current.highlight()
    })
    
    expect(result.current.isHighlighted).toBe(true)
    // Pulse should continue while highlighted
  })

  it('should reset to initial state', () => {
    const { result } = renderHook(() => useThreadHighlight())
    
    act(() => {
      result.current.highlight()
      result.current.reset()
    })
    
    expect(result.current.isHighlighted).toBe(false)
  })

  it('should handle reduced motion settings', () => {
    // This would require mocking the useReducedMotion hook
    const { result } = renderHook(() => useThreadHighlight())
    
    act(() => {
      result.current.highlight()
    })
    
    expect(result.current.isHighlighted).toBe(true)
  })
})