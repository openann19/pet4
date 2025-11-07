import { usePressAnimation } from '@mobile/hooks/use-press-animation'
import { act, renderHook } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import { describe, expect, it, vi } from 'vitest'

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}))

describe('usePressAnimation', () => {
  it('should return animation values and handlers', () => {
    const { result } = renderHook(() => usePressAnimation())

    expect(result.current.scale).toBeDefined()
    expect(result.current.animatedStyle).toBeDefined()
    expect(result.current.handlePress).toBeDefined()
    expect(result.current.handlePressIn).toBeDefined()
    expect(result.current.handlePressOut).toBeDefined()
  })

  it('should trigger haptic feedback on press', () => {
    const { result } = renderHook(() =>
      usePressAnimation({ hapticFeedback: true })
    )

    act(() => {
      result.current.handlePress()
    })

    expect(Haptics.impactAsync).toHaveBeenCalled()
  })

  it('should handle press in and out', () => {
    const { result } = renderHook(() => usePressAnimation())

    act(() => {
      result.current.handlePressIn()
    })

    expect(result.current.scale.value).toBeLessThan(1)

    act(() => {
      result.current.handlePressOut()
    })

    expect(result.current.scale.value).toBe(1)
  })
})

