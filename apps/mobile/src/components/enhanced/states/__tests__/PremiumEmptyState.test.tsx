/**
 * PremiumEmptyState Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/states/__tests__/PremiumEmptyState.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { PremiumEmptyState } from '../PremiumEmptyState'
import * as Haptics from 'expo-haptics'

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}))

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

// Mock reduced motion
vi.mock('@/effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: false })),
}))

// Mock PremiumButton
vi.mock('../../PremiumButton', () => ({
  PremiumButton: ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
    <button onClick={onPress}>{children}</button>
  ),
}))

const mockHaptics = vi.mocked(Haptics)

describe('PremiumEmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByText } = render(<PremiumEmptyState title="No items" />)

    expect(getByText('No items')).toBeTruthy()
  })

  it('renders with description', () => {
    const { getByText } = render(
      <PremiumEmptyState title="No items" description="You have no items yet" />
    )

    expect(getByText('No items')).toBeTruthy()
    expect(getByText('You have no items yet')).toBeTruthy()
  })

  it('renders with icon', () => {
    const icon = <Text>Icon</Text>
    const { getByText } = render(<PremiumEmptyState title="No items" icon={icon} />)

    expect(getByText('No items')).toBeTruthy()
    expect(getByText('Icon')).toBeTruthy()
  })

  it('renders with action button', () => {
    const action = {
      label: 'Add Item',
      onPress: vi.fn(),
    }
    const { getByText } = render(<PremiumEmptyState title="No items" action={action} />)

    expect(getByText('Add Item')).toBeTruthy()
  })

  it('handles action button press', () => {
    const action = {
      label: 'Add Item',
      onPress: vi.fn(),
    }
    const { getByText } = render(<PremiumEmptyState title="No items" action={action} />)

    fireEvent.press(getByText('Add Item'))

    expect(action.onPress).toHaveBeenCalled()
    expect(mockHaptics.impactAsync).toHaveBeenCalledWith('light')
  })

  it('renders with default variant', () => {
    const { getByText } = render(<PremiumEmptyState title="No items" variant="default" />)

    expect(getByText('No items')).toBeTruthy()
  })

  it('renders with minimal variant', () => {
    const { getByText } = render(<PremiumEmptyState title="No items" variant="minimal" />)

    expect(getByText('No items')).toBeTruthy()
  })

  it('renders with illustrated variant', () => {
    const { getByText } = render(<PremiumEmptyState title="No items" variant="illustrated" />)

    expect(getByText('No items')).toBeTruthy()
  })

  it('applies custom style', () => {
    const customStyle = { marginTop: 20 }
    const { getByTestId } = render(<PremiumEmptyState title="No items" style={customStyle} />)

    expect(getByTestId('premium-empty-state')).toBeTruthy()
  })

  it('uses custom testID', () => {
    const { getByTestId } = render(
      <PremiumEmptyState title="No items" testID="custom-empty-state" />
    )

    expect(getByTestId('custom-empty-state')).toBeTruthy()
  })
})
