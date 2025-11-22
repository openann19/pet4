import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react-native'
import { BottomSheet } from '../BottomSheet'
import { Text, View } from 'react-native'

describe('BottomSheet', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should render when visible', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet visible={true} onClose={onClose}>
        <View>
          <Text>Test Content</Text>
        </View>
      </BottomSheet>
    )

    expect(screen.getByText('Test Content')).toBeTruthy()
  })

  it('should not render when not visible', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet visible={false} onClose={onClose}>
        <View>
          <Text>Test Content</Text>
        </View>
      </BottomSheet>
    )

    expect(screen.queryByText('Test Content')).toBeNull()
  })

  it('should accept custom height', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet visible={true} onClose={onClose} height={600}>
        <View>
          <Text>Test Content</Text>
        </View>
      </BottomSheet>
    )

    expect(screen.getByText('Test Content')).toBeTruthy()
  })
})
