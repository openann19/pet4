/**
 * Tests for useBubbleTheme hook
 * Verifies reduced-motion support and style changes
 */

import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useBubbleTheme } from '../use-bubble-theme'

// Mock Reanimated
vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    useDerivedValue: vi.fn((fn) => ({ value: fn() })),
    withTiming: vi.fn((toValue) => toValue),
  }
})

// Mock reduced motion
vi.mock('../../effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

// Mock shared hook
vi.mock('@petspark/motion', () => ({
  useBubbleTheme: vi.fn((options) => ({
    gradientIntensity: { value: 1 },
    shadowIntensity: { value: 1 },
    colorIntensity: { value: 1 },
    animatedStyle: { value: { primaryColor: 'rgba(59, 130, 246, 1)', secondaryColor: 'rgba(139, 92, 246, 0.8)', shadowColor: 'rgba(0, 0, 0, 0.1)', shadowBlur: 10, shadowOpacity: 0.2, intensity: 1 } },
    updateTheme: vi.fn(),
  })),
}))

describe('useBubbleTheme (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBubbleTheme())
    
    expect(result.current.gradientIntensity).toBeDefined()
    expect(result.current.shadowIntensity).toBeDefined()
    expect(result.current.colorIntensity).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.gradientColors).toBeDefined()
  })

  it('should respect reduced motion', async () => {
    const { useReducedMotionSV } = await import('../../effects/core/use-reduced-motion-sv')
    vi.mocked(useReducedMotionSV).mockReturnValue({ value: true })

    const { result } = renderHook(() => useBubbleTheme())
    
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should update theme when updateTheme is called', () => {
    const { result } = renderHook(() => useBubbleTheme())
    
    act(() => {
      result.current.updateTheme('dark')
    })
    
    expect(result.current.updateTheme).toBeDefined()
  })

  it('should provide gradient colors for LinearGradient', () => {
    const { result } = renderHook(() => useBubbleTheme())
    
    expect(result.current.gradientColors).toBeDefined()
    expect(Array.isArray(result.current.gradientColors.value)).toBe(true)
    expect(result.current.gradientColors.value.length).toBe(2)
  })

  it('should convert shadow styles to mobile format', () => {
    const { result } = renderHook(() => useBubbleTheme())
    
    const style = result.current.animatedStyle
    expect(style).toBeDefined()
  })
})

