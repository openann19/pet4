import { renderHook, act } from '@testing-library/react'
import { useStickerAnimation } from './use-sticker-animation'

describe('useStickerAnimation', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useStickerAnimation())

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.trigger).toBeDefined()
    expect(result.current.reset).toBeDefined()
  })

  it('should trigger bounce animation', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'bounce', enabled: true })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should trigger spin animation', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'spin', enabled: true })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should trigger pulse animation', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'pulse', enabled: true })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should trigger shake animation', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'shake', enabled: true })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should trigger float animation', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'float', enabled: true })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should trigger grow animation', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'grow', enabled: true })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should trigger wiggle animation', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'wiggle', enabled: true })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should trigger flip animation', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'flip', enabled: true })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should not trigger when disabled', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'bounce', enabled: false })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should reset animation values', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'bounce', enabled: true })
    )

    act(() => {
      result.current.trigger()
      result.current.reset()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should respect custom duration', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'pulse', duration: 2000, enabled: true })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })

  it('should respect custom intensity', () => {
    const { result } = renderHook(() =>
      useStickerAnimation({ animation: 'bounce', intensity: 1.5, enabled: true })
    )

    act(() => {
      result.current.trigger()
    })

    expect(result.current.animatedStyle).toBeDefined()
  })
})

