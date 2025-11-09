/**
 * ToggleButton Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/buttons/__tests__/ToggleButton.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { ToggleButton } from '../ToggleButton'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
  const Reanimated = {
    default: {
      createAnimatedComponent: (component: unknown) => component,
    },
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withSpring: vi.fn((value: number) => value),
  }
  return Reanimated
})

describe('ToggleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByText } = render(
      <ToggleButton accessibilityLabel="Toggle button">Toggle</ToggleButton>
    )

    expect(getByText('Toggle')).toBeTruthy()
  })

  it('handles toggle state', () => {
    const onCheckedChange = vi.fn()
    const { getByText } = render(
      <ToggleButton onCheckedChange={onCheckedChange} checked={false} accessibilityLabel="Toggle button">
        Toggle
      </ToggleButton>
    )

    fireEvent.press(getByText('Toggle'))

    expect(onCheckedChange).toHaveBeenCalled()
  })

  it('renders in active state', () => {
    const { getByText } = render(
      <ToggleButton checked={true} onCheckedChange={vi.fn()} accessibilityLabel="Toggle button">
        Active
      </ToggleButton>
    )

    expect(getByText('Active')).toBeTruthy()
  })

  it('renders in inactive state', () => {
    const { getByText } = render(
      <ToggleButton checked={false} onCheckedChange={vi.fn()} accessibilityLabel="Toggle button">
        Inactive
      </ToggleButton>
    )

    expect(getByText('Inactive')).toBeTruthy()
  })

  it('calls onCheckedChange when pressed', () => {
    const onCheckedChange = vi.fn()
    const { getByText } = render(
      <ToggleButton onCheckedChange={onCheckedChange} checked={false} accessibilityLabel="Toggle button">
        Toggle
      </ToggleButton>
    )

    fireEvent.press(getByText('Toggle'))

    expect(onCheckedChange).toHaveBeenCalled()
  })

  it('does not call onCheckedChange when disabled', () => {
    const onCheckedChange = vi.fn()
    const { getByText } = render(
      <ToggleButton onCheckedChange={onCheckedChange} checked={false} disabled={true} accessibilityLabel="Toggle button">
        Toggle
      </ToggleButton>
    )

    fireEvent.press(getByText('Toggle'))

    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})
