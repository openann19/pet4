/**
 * AdoptionListingCard Test Suite
 * 
 * Comprehensive tests for the mobile adoption listing card component.
 * Tests rendering, animations, interactions, and accessibility.
 */
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import * as Haptics from 'expo-haptics'

import { AdoptionListingCard } from '../AdoptionListingCard'
import type { AdoptionListing } from '@/hooks/api/use-adoption-marketplace'

// Mock dependencies
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}))

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  
  // Add missing mock functions
  Reanimated.default.createAnimatedComponent = jest.fn().mockImplementation((component) => component)
  
  return {
    ...Reanimated,
    FadeInUp: {
      duration: jest.fn().mockReturnThis(),
      springify: jest.fn().mockReturnThis(),
      damping: jest.fn().mockReturnThis(),
      stiffness: jest.fn().mockReturnThis(),
    },
    Layout: {
      springify: jest.fn().mockReturnThis(),
      damping: jest.fn().mockReturnThis(),
      stiffness: jest.fn().mockReturnThis(),
    },
  }
})

jest.mock('@mobile/utils/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}))

const mockListing: AdoptionListing = {
  id: 'test-listing-1',
  petName: 'Buddy',
  petBreed: 'Golden Retriever',
  petAge: 2,
  petGender: 'male',
  petSize: 'large',
  petPhotos: [
    'https://example.com/buddy1.jpg',
    'https://example.com/buddy2.jpg',
    'https://example.com/buddy3.jpg',
  ],
  location: {
    city: 'San Francisco',
    country: 'USA',
  },
  goodWithKids: true,
  goodWithPets: true,
  vaccinated: true,
  spayedNeutered: false,
  featured: true,
  fee: {
    amount: 350,
    currency: 'USD',
  },
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
}

const mockListingMinimal: AdoptionListing = {
  id: 'test-listing-2',
  petName: 'Whiskers',
  petBreed: 'Mixed',
  petAge: 0.5,
  petGender: 'female',
  petSize: 'small',
  petPhotos: [],
  location: {
    city: 'Portland',
    country: 'USA',
  },
  goodWithKids: false,
  goodWithPets: false,
  vaccinated: false,
  spayedNeutered: true,
  featured: false,
  fee: null,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
}

describe('AdoptionListingCard', () => {
  const mockHandlers = {
    onPress: jest.fn(),
    onFavoritePress: jest.fn(),
    onContactPress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders pet information correctly', () => {
      const { getByText, getByLabelText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      expect(getByText('Buddy')).toBeTruthy()
      expect(getByText('Golden Retriever • Large')).toBeTruthy()
      expect(getByText('2 years • ♂')).toBeTruthy()
      expect(getByText('📍 San Francisco, USA')).toBeTruthy()
      expect(getByText('Adoption fee: $350')).toBeTruthy()
      expect(getByLabelText('Buddy, Golden Retriever, 2 years old')).toBeTruthy()
    })

    it('renders minimal listing correctly', () => {
      const { getByText, queryByText } = render(
        <AdoptionListingCard
          listing={mockListingMinimal}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      expect(getByText('Whiskers')).toBeTruthy()
      expect(getByText('Mixed • Small')).toBeTruthy()
      expect(getByText('6 months • ♀')).toBeTruthy()
      expect(getByText('📍 Portland, USA')).toBeTruthy()
      expect(queryByText(/Adoption fee/)).toBeNull()
    })

    it('shows featured badge for featured listings', () => {
      const { getByText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      expect(getByText('✨ Featured')).toBeTruthy()
    })

    it('shows pet traits correctly', () => {
      const { getByText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      expect(getByText('Good with kids')).toBeTruthy()
      expect(getByText('Good with pets')).toBeTruthy()
      expect(getByText('Vaccinated')).toBeTruthy()
    })

    it('shows distance when provided', () => {
      const { getByText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          showDistance={true}
          distance={5.5}
          {...mockHandlers}
        />
      )

      expect(getByText('📍 San Francisco, USA • 5.5km away')).toBeTruthy()
    })

    it('shows placeholder image when no photos provided', () => {
      const { getByLabelText } = render(
        <AdoptionListingCard
          listing={mockListingMinimal}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      // Should still have accessible image label
      expect(getByLabelText('Photo 1 of 1 of Whiskers')).toBeTruthy()
    })
  })

  describe('Interactions', () => {
    it('calls onPress when card is pressed', async () => {
      const { getByLabelText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      const card = getByLabelText('Buddy, Golden Retriever, 2 years old')
      fireEvent.press(card)

      await waitFor(() => {
        expect(mockHandlers.onPress).toHaveBeenCalledWith(mockListing)
        expect(Haptics.impactAsync).toHaveBeenCalledWith('light')
      })
    })

    it('calls onFavoritePress when favorite button is pressed', async () => {
      const { getByLabelText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      const favoriteButton = getByLabelText('Add Buddy to favorites')
      fireEvent.press(favoriteButton)

      await waitFor(() => {
        expect(mockHandlers.onFavoritePress).toHaveBeenCalledWith(mockListing)
        expect(Haptics.impactAsync).toHaveBeenCalledWith('medium')
      })
    })

    it('calls onContactPress when contact button is pressed', async () => {
      const { getByLabelText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      const contactButton = getByLabelText('Contact about Buddy')
      fireEvent.press(contactButton)

      await waitFor(() => {
        expect(mockHandlers.onContactPress).toHaveBeenCalledWith(mockListing)
        expect(Haptics.impactAsync).toHaveBeenCalledWith('medium')
      })
    })

    it('shows different haptic feedback when unfavoriting', async () => {
      const { getByLabelText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={true}
          {...mockHandlers}
        />
      )

      const favoriteButton = getByLabelText('Remove Buddy from favorites')
      fireEvent.press(favoriteButton)

      await waitFor(() => {
        expect(Haptics.impactAsync).toHaveBeenCalledWith('light')
      })
    })

    it('handles image press correctly', async () => {
      const { getByLabelText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      const imageView = getByLabelText('View photos of Buddy')
      fireEvent.press(imageView)

      await waitFor(() => {
        expect(mockHandlers.onPress).toHaveBeenCalledWith(mockListing)
        expect(Haptics.impactAsync).toHaveBeenCalledWith('light')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper accessibility labels and roles', () => {
      const { getByRole, getByLabelText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      expect(getByRole('button', { name: /Buddy, Golden Retriever, 2 years old/ })).toBeTruthy()
      expect(getByRole('button', { name: /Add Buddy to favorites/ })).toBeTruthy()
      expect(getByRole('button', { name: /Contact about Buddy/ })).toBeTruthy()
      expect(getByLabelText('View photos of Buddy')).toBeTruthy()
    })

    it('indicates favorite state in accessibility', () => {
      const { getByRole } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={true}
          {...mockHandlers}
        />
      )

      const favoriteButton = getByRole('button', { name: /Remove Buddy from favorites/ })
      expect(favoriteButton.props.accessibilityState.selected).toBe(true)
    })

    it('provides accessibility hints', () => {
      const { getByLabelText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      const card = getByLabelText('Buddy, Golden Retriever, 2 years old')
      expect(card.props.accessibilityHint).toBe('Double tap to view full details')

      const imageView = getByLabelText('View photos of Buddy')
      expect(imageView.props.accessibilityHint).toBe('Double tap to view full screen photos')
    })
  })

  describe('Age Formatting', () => {
    it('formats age in months for pets under 1 year', () => {
      const youngListing = { ...mockListing, petAge: 0.5 }
      const { getByText } = render(
        <AdoptionListingCard
          listing={youngListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      expect(getByText('6 months • ♂')).toBeTruthy()
    })

    it('formats singular year correctly', () => {
      const yearOldListing = { ...mockListing, petAge: 1 }
      const { getByText } = render(
        <AdoptionListingCard
          listing={yearOldListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      expect(getByText('1 year • ♂')).toBeTruthy()
    })

    it('formats plural years correctly', () => {
      const { getByText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      expect(getByText('2 years • ♂')).toBeTruthy()
    })
  })

  describe('Gender Display', () => {
    it('shows correct symbol for male pets', () => {
      const { getByText } = render(
        <AdoptionListingCard
          listing={mockListing}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      expect(getByText('2 years • ♂')).toBeTruthy()
    })

    it('shows correct symbol for female pets', () => {
      const { getByText } = render(
        <AdoptionListingCard
          listing={mockListingMinimal}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      expect(getByText('6 months • ♀')).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('handles missing optional props gracefully', () => {
      const { getByText } = render(
        <AdoptionListingCard
          listing={mockListingMinimal}
          isFavorited={false}
          onPress={mockHandlers.onPress}
          onFavoritePress={mockHandlers.onFavoritePress}
          onContactPress={mockHandlers.onContactPress}
        />
      )

      expect(getByText('Whiskers')).toBeTruthy()
    })

    it('handles empty photo array', () => {
      const { getByLabelText } = render(
        <AdoptionListingCard
          listing={mockListingMinimal}
          isFavorited={false}
          {...mockHandlers}
        />
      )

      // Should render placeholder image
      expect(getByLabelText('Photo 1 of 1 of Whiskers')).toBeTruthy()
    })
  })
})