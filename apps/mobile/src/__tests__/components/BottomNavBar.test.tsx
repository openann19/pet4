import { BottomNavBar, type TabKey } from '../components/BottomNavBar'
import { fireEvent, render } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'
import { describe, expect, it, vi } from 'vitest'

describe('BottomNavBar', () => {
  const items = [
    { key: 'feed' as TabKey, label: 'Feed' },
    { key: 'community' as TabKey, label: 'Community' },
    { key: 'profile' as TabKey, label: 'Profile' },
  ]

  it('should render all items', () => {
    const onChange = vi.fn()
    const { getByText } = render(<BottomNavBar active="feed" items={items} onChange={onChange} />)

    expect(getByText('Feed')).toBeTruthy()
    expect(getByText('Community')).toBeTruthy()
    expect(getByText('Profile')).toBeTruthy()
  })

  it('should call onChange when item is pressed', () => {
    const onChange = vi.fn()
    const { getByText } = render(<BottomNavBar active="feed" items={items} onChange={onChange} />)

    fireEvent.press(getByText('Community'))
    expect(onChange).toHaveBeenCalledWith('community')
  })

  it('should trigger haptic feedback on press', async () => {
    const onChange = vi.fn()
    const { getByText } = render(<BottomNavBar active="feed" items={items} onChange={onChange} />)

    fireEvent.press(getByText('Community'))
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
  })

  it('should not call onChange when active item is pressed', () => {
    const onChange = vi.fn()
    const { getByText } = render(<BottomNavBar active="feed" items={items} onChange={onChange} />)

    fireEvent.press(getByText('Feed'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('should display badge when provided', () => {
    const itemsWithBadge = [
      { key: 'feed' as TabKey, label: 'Feed', badge: 5 },
      { key: 'community' as TabKey, label: 'Community', badge: 0 },
      { key: 'profile' as TabKey, label: 'Profile', badge: 12 },
    ]

    const onChange = vi.fn()
    const { getByText } = render(
      <BottomNavBar active="feed" items={itemsWithBadge} onChange={onChange} />
    )

    expect(getByText('5')).toBeTruthy()
    expect(getByText('9+')).toBeTruthy()
  })

  it('should not display badge when badge is 0 or undefined', () => {
    const itemsWithBadge = [
      { key: 'feed' as TabKey, label: 'Feed', badge: 0 },
      { key: 'community' as TabKey, label: 'Community' },
    ]

    const onChange = vi.fn()
    const { queryByText } = render(
      <BottomNavBar active="feed" items={itemsWithBadge} onChange={onChange} />
    )

    expect(queryByText('0')).toBeNull()
  })

  it('should display 9+ for badges greater than 9', () => {
    const itemsWithBadge = [{ key: 'feed' as TabKey, label: 'Feed', badge: 15 }]

    const onChange = vi.fn()
    const { getByText } = render(
      <BottomNavBar active="feed" items={itemsWithBadge} onChange={onChange} />
    )

    expect(getByText('9+')).toBeTruthy()
  })

  it('should have proper accessibility attributes', () => {
    const onChange = vi.fn()
    const { getByText } = render(<BottomNavBar active="feed" items={items} onChange={onChange} />)

    const feedButton = getByText('Feed')
    expect(feedButton.props.accessibilityRole).toBe('tab')
    expect(feedButton.props.accessibilityState?.selected).toBe(true)
    expect(feedButton.props.accessibilityLabel).toBe('Feed')

    const communityButton = getByText('Community')
    expect(communityButton.props.accessibilityState?.selected).toBe(false)
  })
})
