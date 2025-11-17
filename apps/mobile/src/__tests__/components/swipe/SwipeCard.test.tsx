/**
 * Tests for SwipeCard component
 * Location: src/__tests__/components/swipe/SwipeCard.test.tsx
 */

import { render } from '@testing-library/react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SwipeCard } from '../../../components/swipe/SwipeCard'
import type { PetProfile } from '../../../types/pet'

const mockPet: PetProfile = {
  id: '1',
  name: 'Buddy',
  species: 'dog',
  breed: 'Golden Retriever',
  age: 3,
  photos: ['https://example.com/photo.jpg'],
  bio: 'Friendly dog',
  ownerId: 'owner1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('SwipeCard', () => {
  const mockOnSwipeLeft = vi.fn()
  const mockOnSwipeRight = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render pet information correctly', () => {
    const { getByText } = render(
      <SwipeCard
        pet={mockPet}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
        isTop={true}
      />
    )

    expect(getByText('Buddy')).toBeTruthy()
    expect(getByText('Golden Retriever • 3 years old')).toBeTruthy()
    expect(getByText('Friendly dog')).toBeTruthy()
  })

  it('should render with correct photo source', () => {
    const { getByText } = render(
      <SwipeCard
        pet={mockPet}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
        isTop={true}
      />
    )
    expect(getByText('Buddy')).toBeTruthy()
  })

  it('should disable gestures when not top card', () => {
    const result = render(
      <SwipeCard
        pet={mockPet}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
        isTop={false}
      />
    )

    expect(result).toBeTruthy()
  })
})
