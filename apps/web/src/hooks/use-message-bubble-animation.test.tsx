import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMessageBubbleAnimation } from '@/hooks/use-message-bubble-animation'

describe('useMessageBubbleAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    expect(result.current.opacity.value).toBe(0)
    expect(result.current.translateY.value).toBe(20)
    expect(result.current.scale.value).toBe(1)
  })

  it('should initialize with provided values when isNew is false', () => {
    const { result } = renderHook(() =>
      useMessageBubbleAnimation({ isNew: false })
    )

    expect(result.current.opacity.value).toBe(1)
    expect(result.current.translateY.value).toBe(0)
  })

  it('should handle press in events', () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    act(() => {
      result.current.handlePressIn()
    })

    expect(result.current.scale.value).toBeLessThan(1)
    expect(result.current.glowOpacity.value).toBeGreaterThan(0)
  })

  it('should handle press out events', () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    act(() => {
      result.current.handlePressIn()
    })

    act(() => {
      result.current.handlePressOut()
    })

    expect(result.current.scale.value).toBe(1)
  })

  it('should animate highlight when isHighlighted changes', () => {
    const { result, rerender } = renderHook(
      ({ isHighlighted }) => useMessageBubbleAnimation({ isHighlighted }),
      { initialProps: { isHighlighted: false } }
    )

    expect(result.current.backgroundOpacity.value).toBe(0)

    rerender({ isHighlighted: true })

    expect(result.current.backgroundOpacity.value).toBeGreaterThan(0)
  })

  it('should stagger animations based on index', () => {
    const { result: result0 } = renderHook(() =>
      useMessageBubbleAnimation({ index: 0, isNew: true })
    )
    const { result: result1 } = renderHook(() =>
      useMessageBubbleAnimation({ index: 1, isNew: true })
    )

    expect(result0.current.opacity.value).toBe(0)
    expect(result1.current.opacity.value).toBe(0)
  })

  it('should call onLongPress after delay', async () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() =>
      useMessageBubbleAnimation({ onLongPress })
    )

    act(() => {
      result.current.handlePressIn()
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
    })

    expect(onLongPress).toHaveBeenCalled()
  })

  it('should animate reaction', () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    act(() => {
      result.current.animateReaction('❤️')
    })

    expect(result.current.scale.value).toBeGreaterThan(0)
  })

  it('should provide animated styles', () => {
    const { result } = renderHook(() => useMessageBubbleAnimation())

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.glowStyle).toBeDefined()
    expect(result.current.backgroundStyle).toBeDefined()
  })
})

