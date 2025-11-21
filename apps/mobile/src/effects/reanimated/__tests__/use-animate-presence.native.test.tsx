/**
 * Tests for useAnimatePresence hook
 * Verifies reduced-motion support and enter/exit animations
 */

import { renderHook } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAnimatePresence } from '../use-animate-presence'

vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withTiming: vi.fn((toValue) => toValue),
    withSpring: vi.fn((toValue) => toValue),
  }
})

vi.mock('../../effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

describe('useAnimatePresence (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values when visible', () => {
    const { result } = renderHook(() => useAnimatePresence({ isVisible: true }))

    expect(result.current.opacity).toBeDefined()
    expect(result.current.scale).toBeDefined()
    expect(result.current.translateX).toBeDefined()
    expect(result.current.translateY).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.shouldRender).toBe(true)
  })

  it('should respect reduced motion', () => {
    const { useReducedMotionSV } = require('../../effects/core/use-reduced-motion-sv')
    useReducedMotionSV.mockReturnValue({ value: true })

    const { result } = renderHook(() => useAnimatePresence({ isVisible: true }))

    expect(result.current.shouldRender).toBe(true)
    expect(result.current.opacity.value).toBe(1)
  })

  it('should handle fade transition', () => {
    const { result } = renderHook(() =>
      useAnimatePresence({
        isVisible: true,
        enterTransition: 'fade',
        exitTransition: 'fade'
      })
    )

    expect(result.current.shouldRender).toBe(true)
  })

  it('should handle scale transition', () => {
    const { result } = renderHook(() =>
      useAnimatePresence({
        isVisible: true,
        enterTransition: 'scale',
        exitTransition: 'scale'
      })
    )

    expect(result.current.shouldRender).toBe(true)
  })

  it('should handle slide transitions', () => {
    const transitions = ['slideUp', 'slideDown', 'slideLeft', 'slideRight'] as const

    transitions.forEach((transition) => {
      const { result } = renderHook(() =>
        useAnimatePresence({
          isVisible: true,
          enterTransition: transition,
          exitTransition: transition
        })
      )

      expect(result.current.shouldRender).toBe(true)
    })
  })

  it('should call onExitComplete when exiting', (done) => {
    const onExitComplete = vi.fn(() => {
      done()
    })

    const { rerender } = renderHook(
      ({ isVisible }) => useAnimatePresence({
        isVisible,
        onExitComplete,
        exitDuration: 10
      }),
      { initialProps: { isVisible: true } }
    )

    rerender({ isVisible: false })

    // Wait for exit animation
    setTimeout(() => {
      expect(onExitComplete).toHaveBeenCalled()
    }, 20)
  })
})
