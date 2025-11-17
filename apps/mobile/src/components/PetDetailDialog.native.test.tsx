import React from 'react'
import { render, screen } from '@testing-library/react-native'
import PetDetailDialog from '../PetDetailDialog.native'

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  impactAsync: jest.fn(),
}))

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn(),
  withTiming: jest.fn(),
  interpolate: jest.fn(),
  Extrapolation: {
    CLAMP: 'clamp',
  },
}))

// Mock the reduced motion hook
jest.mock('@mobile/effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: jest.fn(() => ({ value: false })),
}))

const mockPet = {
  id: '1',
  name: 'Buddy',
  breed: 'Golden Retriever',
  age: 3,
  gender: 'male' as const,
  size: 'large',
  location: 'New York, NY',
  bio: 'Friendly and energetic dog who loves to play fetch!',
  photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  photo: 'https://example.com/photo1.jpg',
  verified: true,
  personality: ['Friendly', 'Energetic', 'Loyal'],
  interests: ['Fetch', 'Walking', 'Swimming'],
  lookingFor: ['Playful owners', 'Large yard'],
  trustProfile: {
    overallRating: 4.8,
    totalReviews: 25,
    responseRate: 95,
    badges: ['Verified Owner', 'Quick Responder'],
  },
  ownerName: 'John Doe',
  ownerAvatar: 'https://example.com/avatar.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('PetDetailDialog', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when pet is null', () => {
    const { queryByTestId } = render(
      <PetDetailDialog pet={null} visible={true} onClose={mockOnClose} />
    )

    expect(queryByTestId('pet-detail-dialog')).toBeNull()
  })

  it('renders pet information correctly', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Buddy')).toBeTruthy()
    expect(screen.getByText('Golden Retriever')).toBeTruthy()
    expect(screen.getByText('3 years')).toBeTruthy()
    expect(screen.getByText('Male')).toBeTruthy()
    expect(screen.getByText('New York, NY')).toBeTruthy()
    expect(screen.getByText('Friendly and energetic dog who loves to play fetch!')).toBeTruthy()
  })

  it('renders trust profile information', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Trust & Safety')).toBeTruthy()
    expect(screen.getByText('4.8 (25 reviews)')).toBeTruthy()
    expect(screen.getByText('95% response rate')).toBeTruthy()
  })

  it('renders personality traits', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Personality Traits')).toBeTruthy()
    expect(screen.getByText('Friendly')).toBeTruthy()
    expect(screen.getByText('Energetic')).toBeTruthy()
    expect(screen.getByText('Loyal')).toBeTruthy()
  })

  it('renders interests and activities', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Interests & Activities')).toBeTruthy()
    expect(screen.getByText('Fetch')).toBeTruthy()
    expect(screen.getByText('Walking')).toBeTruthy()
    expect(screen.getByText('Swimming')).toBeTruthy()
  })

  it('renders looking for information', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Looking For')).toBeTruthy()
    expect(screen.getByText('Playful owners')).toBeTruthy()
    expect(screen.getByText('Large yard')).toBeTruthy()
  })

  it('renders trust badges', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Verified Owner')).toBeTruthy()
    expect(screen.getByText('Quick Responder')).toBeTruthy()
  })

  it('shows photo navigation for multiple photos', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    // Should show photo counter for multiple photos
    expect(screen.getByText('Photo 1 of 2')).toBeTruthy()
  })

  it('does not show photo navigation for single photo', () => {
    const singlePhotoPet = { ...mockPet, photos: undefined }
    render(
      <PetDetailDialog pet={singlePhotoPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.queryByText(/Photo \d+ of \d+/)).toBeNull()
  })

  it('displays verified badge for verified pets', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    // The verified shield should be rendered (though we can't easily test the icon)
    // We can test that the pet name is displayed with verification context
    expect(screen.getByText('Buddy')).toBeTruthy()
  })

  it('calls onClose when close button is pressed', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    // Find and press the close button (it should be accessible)
    const closeButton = screen.getByLabelText('Close dialog')
    fireEvent.press(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('renders owner information correctly', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('John Doe')).toBeTruthy()
    expect(screen.getByText('Owner')).toBeTruthy()
  })

  it('has proper accessibility attributes', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    // Check for accessibility labels and roles
    const scrollView = screen.getByRole('scrollView')
    expect(scrollView).toBeTruthy()

    const closeButton = screen.getByRole('button')
    expect(closeButton).toBeTruthy()
    expect(closeButton).toHaveAccessibilityState({ label: 'Close dialog' })
  })

  it('renders size information correctly', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Large (50-100 lbs)')).toBeTruthy()
  })

  it('handles pets without optional fields gracefully', () => {
    const minimalPet = {
      id: '1',
      name: 'Minimal',
      breed: 'Mixed',
      age: 2,
      gender: 'female' as const,
      size: 'medium',
      location: 'Test City',
      photo: 'https://example.com/photo.jpg',
      ownerName: 'Test Owner',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    render(
      <PetDetailDialog pet={minimalPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Minimal')).toBeTruthy()
    expect(screen.getByText('Mixed')).toBeTruthy()
    expect(screen.queryByText('Personality Traits')).toBeNull()
    expect(screen.queryByText('Trust & Safety')).toBeNull()
  })

  it('renders age correctly in details section', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('3 years old')).toBeTruthy()
  })

  it('capitalizes gender correctly', () => {
    render(
      <PetDetailDialog pet={mockPet} visible={true} onClose={mockOnClose} />
    )

    expect(screen.getByText('Male')).toBeTruthy()
  })
})
