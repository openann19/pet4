import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { useModalAnimation } from '../use-modal-animation'

describe('useModalAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with hidden values when not visible', () => {
    const { result } = renderHook(() => useModalAnimation({ isVisible: false }))

    expect(
      (
        result.current as {
          opacity: { value: number }
          scale: { value: number }
          y: { value: number }
        }
      ).opacity.value
    ).toBe(0)
    expect(
      (
        result.current as {
          opacity: { value: number }
          scale: { value: number }
          y: { value: number }
        }
      ).scale.value
    ).toBe(0.9)
    expect(
      (
        result.current as {
          opacity: { value: number }
          scale: { value: number }
          y: { value: number }
        }
      ).y.value
    ).toBe(20)
  })

  it('should animate to visible state', async () => {
    interface Props {
      isVisible: boolean
    }
    const { result, rerender } = renderHook(
      (props: Props) => useModalAnimation({ isVisible: props.isVisible }),
      {
        initialProps: { isVisible: false },
      }
    )

    const current = result.current as { opacity: { value: number }; scale: { value: number } }
    expect(current.opacity.value).toBe(0)

    rerender({ isVisible: true })

    vi.advanceTimersByTime(300)

    await waitFor(() => {
      expect(current.opacity.value).toBeGreaterThan(0)
      expect(current.scale.value).toBeGreaterThan(0.9)
    })
  })

  it('should animate to hidden state', async () => {
    interface Props {
      isVisible: boolean
    }
    const { result, rerender } = renderHook(
      (props: Props) => useModalAnimation({ isVisible: props.isVisible }),
      {
        initialProps: { isVisible: true },
      }
    )

    rerender({ isVisible: false })

    vi.advanceTimersByTime(300)

    await waitFor(() => {
      const current = result.current as { opacity: { value: number } }
      expect(current.opacity.value).toBe(0)
    })
  })

  it('should accept custom duration', async () => {
    interface Props {
      isVisible: boolean
    }
    const { result, rerender } = renderHook(
      (props: Props) => useModalAnimation({ isVisible: props.isVisible, duration: 500 }),
      {
        initialProps: { isVisible: false },
      }
    )

    rerender({ isVisible: true })

    vi.advanceTimersByTime(250)

    await waitFor(() => {
      const current = result.current as { opacity: { value: number } }
      expect(current.opacity.value).toBeLessThan(1)
    })
  })

  it('should return animated style', () => {
    const { result } = renderHook(() => useModalAnimation({ isVisible: true }))

    const current = result.current as { style: unknown }
    expect(current.style).toBeDefined()
  })
})
