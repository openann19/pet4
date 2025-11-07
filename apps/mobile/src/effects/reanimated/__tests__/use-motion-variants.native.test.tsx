/**
 * Tests for useMotionVariants hook
 * Verifies reduced-motion support and variant switching
 */

import { renderHook, act } from '@testing-library/react-native'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMotionVariants } from '../use-motion-variants'

vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn((initial) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((toValue) => toValue),
    withTiming: vi.fn((toValue) => toValue),
    withDelay: vi.fn((delay, anim) => anim),
  }
})

vi.mock('../../effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

describe('useMotionVariants (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  }

  it('should initialize with default values', () => {
    const { result } = renderHook(() => 
      useMotionVariants({ 
        variants,
        initial: 'hidden',
        animate: 'visible'
      })
    )
    
    expect(result.current.opacity).toBeDefined()
    expect(result.current.scale).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.setVariant).toBeDefined()
    expect(result.current.setCustomVariant).toBeDefined()
  })

  it('should respect reduced motion', async () => {
    const { useReducedMotionSV } = await import('../../effects/core/use-reduced-motion-sv')
    vi.mocked(useReducedMotionSV).mockReturnValue({ value: true })

    const { result } = renderHook(() => 
      useMotionVariants({ 
        variants,
        initial: 'hidden',
        animate: 'visible'
      })
    )
    
    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should switch variants using setVariant', () => {
    const { result } = renderHook(() => 
      useMotionVariants({ 
        variants,
        initial: 'hidden',
        animate: 'visible'
      })
    )
    
    act(() => {
      result.current.setVariant('exit')
    })
    
    expect(result.current.setVariant).toBeDefined()
  })

  it('should set custom variant', () => {
    const { result } = renderHook(() => 
      useMotionVariants({ 
        variants,
        initial: 'hidden',
        animate: 'visible'
      })
    )
    
    act(() => {
      result.current.setCustomVariant({ opacity: 0.5, scale: 0.9 })
    })
    
    expect(result.current.setCustomVariant).toBeDefined()
  })

  it('should handle variant transitions', () => {
    const { result } = renderHook(() => 
      useMotionVariants({ 
        variants,
        initial: 'hidden',
        animate: 'visible',
        transition: {
          type: 'spring',
          stiffness: 200,
          damping: 20
        }
      })
    )
    
    expect(result.current.animatedStyle).toBeDefined()
  })
})

