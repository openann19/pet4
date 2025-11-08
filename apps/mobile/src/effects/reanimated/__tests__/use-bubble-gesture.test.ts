import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import { useBubbleGesture } from '../use-bubble-gesture'

vi.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
  impactAsync: vi.fn(),
}))

describe('useBubbleGesture', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useBubbleGesture())

    expect(result.current.scale.value).toBe(1)
    expect(result.current.glowOpacity.value).toBe(0)
  })

  it('should handle press in', async () => {
    const { result } = renderHook(() => useBubbleGesture({ hapticFeedback: true }))

    result.current.handlePressIn()

    await waitFor(() => {
      expect(result.current.scale.value).toBeLessThan(1)
      expect(Haptics.impactAsync).toHaveBeenCalled()
    })
  })

  it('should handle press out', async () => {
    const { result } = renderHook(() => useBubbleGesture())

    result.current.handlePressIn()
    result.current.handlePressOut()

    await waitFor(() => {
      expect(result.current.scale.value).toBe(1)
      expect(result.current.glowOpacity.value).toBe(0)
    })
  })

  it('should handle press', () => {
    const onPress = vi.fn()
    const { result } = renderHook(() => useBubbleGesture({ onPress, hapticFeedback: false }))

    result.current.handlePressIn()
    result.current.handlePress()

    expect(onPress).toHaveBeenCalled()
  })

  it('should handle long press', async () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() =>
      useBubbleGesture({
        onLongPress,
        longPressDelay: 500,
        hapticFeedback: true,
      })
    )

    result.current.handlePressIn()

    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(onLongPress).toHaveBeenCalled()
      expect(result.current.glowOpacity.value).toBeGreaterThan(0)
    })
  })

  it('should show reaction menu', async () => {
    const { result } = renderHook(() => useBubbleGesture())

    result.current.showReactionMenu()

    await waitFor(() => {
      expect(result.current.reactionMenuOpacity.value).toBeGreaterThan(0)
    })
  })

  it('should hide reaction menu', async () => {
    const { result } = renderHook(() => useBubbleGesture())

    result.current.showReactionMenu()
    result.current.hideReactionMenu()

    await waitFor(() => {
      expect(result.current.reactionMenuOpacity.value).toBe(0)
    })
  })

  it('should return animated styles', () => {
    const { result } = renderHook(() => useBubbleGesture())

    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.glowStyle).toBeDefined()
    expect(result.current.reactionMenuStyle).toBeDefined()
  })
})
