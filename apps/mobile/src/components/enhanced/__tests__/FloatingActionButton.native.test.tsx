/**
 * FloatingActionButton Component Tests (Mobile)
 * Location: apps/mobile/src/components/enhanced/__tests__/FloatingActionButton.native.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { FloatingActionButton } from '../FloatingActionButton.native'

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}))

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    createAnimatedComponent: (component: unknown) => component,
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn((fn: () => Record<string, unknown>) => fn()),
  withSpring: vi.fn((value: number) => value),
  withTiming: vi.fn((value: number) => value),
  withRepeat: vi.fn((anim: number) => anim),
  withSequence: vi.fn((...anims: number[]) => anims[0]),
  withDelay: vi.fn((_delay: number, anim: number) => anim),
  Easing: {
    linear: (t: number) => t,
  },
}))

// Mock AccessibilityInfo
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native')
  return {
    ...actual,
    AccessibilityInfo: {
      isReduceMotionEnabled: vi.fn(() => Promise.resolve(false)),
    },
  }
})

describe('FloatingActionButton (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with default icon', () => {
    const { getByTestId } = render(<FloatingActionButton />)
    expect(getByTestId('floating-action-button')).toBeTruthy()
  })

  it('should render with custom icon', () => {
    const { getByText } = render(
      <FloatingActionButton icon={<Text>Custom</Text>} />
    )
    expect(getByText('Custom')).toBeTruthy()
  })

  it('should call onClick when pressed', () => {
    const onClick = vi.fn()
    const { getByTestId } = render(<FloatingActionButton onClick={onClick} />)
    const button = getByTestId('floating-action-button')
    fireEvent.press(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should render label when expanded', () => {
    const { getByText } = render(
      <FloatingActionButton expanded label="Add Item" />
    )
    expect(getByText('Add Item')).toBeTruthy()
  })

  it('should not render label when not expanded', () => {
    const { queryByText } = render(<FloatingActionButton label="Add Item" />)
    expect(queryByText('Add Item')).toBeNull()
  })

  it('should have accessibility props', () => {
    const { getByTestId } = render(
      <FloatingActionButton label="Add Item" />
    )
    const button = getByTestId('floating-action-button')
    expect(button.props.accessibilityRole).toBe('button')
    expect(button.props.accessibilityLabel).toBe('Add Item')
  })
})

