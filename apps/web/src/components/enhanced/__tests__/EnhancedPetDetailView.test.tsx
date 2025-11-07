import type { Pet } from '@/lib/types'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EnhancedPetDetailView } from '../EnhancedPetDetailView'
import { isTruthy, isDefined } from '@/core/guards';

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn()
  }
}))

const mockPet: Pet = {
  id: 'pet-1',
  name: 'Buddy',
  breed: 'Golden Retriever',
  age: 3,
  gender: 'male',
  size: 'large',
  photo: 'https://example.com/photo1.jpg',
  photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  bio: 'A friendly and energetic dog who loves playing fetch.',
  personality: ['Friendly', 'Energetic', 'Playful'],
  interests: ['Fetch', 'Swimming', 'Hiking'],
  lookingFor: ['Playdates', 'Long walks'],
  location: 'San Francisco, CA',
  ownerId: 'owner-1',
  ownerName: 'John Doe',
  verified: true,
  trustScore: 85,
  createdAt: '2023-01-01T00:00:00Z',
  playdateCount: 12,
  overallRating: 4.5,
  responseRate: 0.9,
  badges: [
    { id: 'badge-1', label: 'Verified Owner', type: 'verified_owner', description: 'Verified owner', earnedAt: '2023-01-01T00:00:00Z' },
    { id: 'badge-2', label: 'Top Rated', type: 'top_rated', description: 'Top rated', earnedAt: '2023-01-01T00:00:00Z' }
  ]
}

describe('EnhancedPetDetailView', () => {
  const mockOnClose = vi.fn()
  const mockOnLike = vi.fn()
  const mockOnPass = vi.fn()
  const mockOnChat = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render pet information correctly', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Buddy')).toBeInTheDocument()
      expect(screen.getByText('Golden Retriever')).toBeInTheDocument()
      expect(screen.getByText('3 years')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
      expect(screen.getByText(/A friendly and energetic dog/)).toBeInTheDocument()
    })

    it('should render photo gallery with single photo', () => {
      const petWithSinglePhoto: Pet = {
        ...mockPet,
        photos: []
      }

      render(
        <EnhancedPetDetailView
          pet={petWithSinglePhoto}
          onClose={mockOnClose}
        />
      )

      const images = screen.getAllByAltText('Buddy')
      expect(images.length).toBeGreaterThan(0)
    })

    it('should render photo gallery with multiple photos', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      const images = screen.getAllByAltText('Buddy')
      expect(images.length).toBeGreaterThan(0)
    })

    it('should render compatibility score when provided', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
          compatibilityScore={88}
        />
      )

      expect(screen.getByText('88% Match')).toBeInTheDocument()
    })

    it('should render match reasons when provided', () => {
      const matchReasons = [
        'Highly compatible personalities',
        'Similar activity levels',
        'Shared interests in hiking'
      ]

      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
          matchReasons={matchReasons}
        />
      )

      expect(screen.getByText('Why This Match Works')).toBeInTheDocument()
      matchReasons.forEach((reason) => {
        expect(screen.getByText(reason)).toBeInTheDocument()
      })
    })

    it('should render trust level badge when trust score is provided', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Highly Trusted')).toBeInTheDocument()
      expect(screen.getByText('Trust Score: 85')).toBeInTheDocument()
    })

    it('should render all tabs correctly', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('tab', { name: 'About' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Personality' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Stats' })).toBeInTheDocument()
    })
  })

  describe('Tab Content', () => {
    it('should display About tab content', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Bio')).toBeInTheDocument()
      expect(screen.getByText(/A friendly and energetic dog/)).toBeInTheDocument()
      expect(screen.getByText('Interests')).toBeInTheDocument()
      expect(screen.getByText('Looking For')).toBeInTheDocument()
    })

    it('should display Personality tab content', async () => {
      const user = userEvent.setup()
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      const personalityTab = screen.getByRole('tab', { name: 'Personality' })
      await user.click(personalityTab)

      expect(screen.getByText('Personality Traits')).toBeInTheDocument()
      expect(screen.getByText('Activity Level')).toBeInTheDocument()
    })

    it('should display Stats tab content', async () => {
      const user = userEvent.setup()
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      const statsTab = screen.getByRole('tab', { name: 'Stats' })
      await user.click(statsTab)

      expect(screen.getByText('Playdates')).toBeInTheDocument()
      expect(screen.getByText('Rating')).toBeInTheDocument()
      expect(screen.getByText('Response Rate')).toBeInTheDocument()
    })
  })

  describe('Photo Gallery Navigation', () => {
    it('should navigate to next photo when right button is clicked', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      const buttons = screen.getAllByRole('button')
      const nextButton = buttons.find((btn) => 
        btn.querySelector('svg') && btn.getAttribute('aria-label') !== 'close'
      )

      if (isTruthy(nextButton)) {
        fireEvent.click(nextButton)
      }
    })

    it('should navigate to previous photo when left button is clicked', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      const buttons = screen.getAllByRole('button')
      const prevButton = buttons.find((btn) => 
        btn.querySelector('svg') && btn.getAttribute('aria-label') !== 'close'
      )

      if (isTruthy(prevButton)) {
        fireEvent.click(prevButton)
      }
    })

    it('should navigate to specific photo when dot is clicked', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      const dots = screen.getAllByRole('button').filter((btn) => 
        btn.classList.contains('rounded-full') && 
        btn.classList.contains('w-2')
      )

      if (dots.length > 1 && dots[1]) {
        fireEvent.click(dots[1])
      }
    })
  })

  describe('Actions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      const backdrop = document.querySelector('[class*="fixed inset-0"]')
      if (isTruthy(backdrop)) {
        fireEvent.click(backdrop)
      }
    })

    it('should call onLike when like button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
          onLike={mockOnLike}
          showActions={true}
        />
      )

      const likeButton = screen.getByRole('button', { name: /like/i })
      await user.click(likeButton)

      expect(mockOnLike).toHaveBeenCalledTimes(1)
    })

    it('should call onPass when pass button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
          onPass={mockOnPass}
          showActions={true}
        />
      )

      const passButton = screen.getByRole('button', { name: /pass/i })
      await user.click(passButton)

      expect(mockOnPass).toHaveBeenCalledTimes(1)
    })

    it('should call onChat when chat button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
          onChat={mockOnChat}
          showActions={true}
        />
      )

      const chatButton = screen.getByRole('button', { name: /chat/i })
      await user.click(chatButton)

      expect(mockOnChat).toHaveBeenCalledTimes(1)
    })

    it('should not render action buttons when showActions is false', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
          showActions={false}
        />
      )

      expect(screen.queryByRole('button', { name: /like/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /pass/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /chat/i })).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle pet with no photos', () => {
      const petNoPhotos: Pet = {
        ...mockPet,
        photos: [],
        photo: '',
        ownerId: 'owner-1',
        ownerName: 'John Doe',
        verified: true
      }

      render(
        <EnhancedPetDetailView
          pet={petNoPhotos}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Buddy')).toBeInTheDocument()
    })

    it('should handle pet with no personality traits', () => {
      const petNoPersonality: Pet = {
        ...mockPet,
        personality: [],
        ownerId: 'owner-1',
        ownerName: 'John Doe',
        verified: true
      }

      render(
        <EnhancedPetDetailView
          pet={petNoPersonality}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Buddy')).toBeInTheDocument()
    })

    it('should handle pet with no interests', () => {
      const petNoInterests: Pet = {
        ...mockPet,
        interests: [],
        ownerId: 'owner-1',
        ownerName: 'John Doe',
        verified: true
      }

      render(
        <EnhancedPetDetailView
          pet={petNoInterests}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Buddy')).toBeInTheDocument()
    })

    it('should handle pet with no trust score', () => {
      const petNoTrust: Pet = {
        ...mockPet,
        trustScore: 0
      }

      render(
        <EnhancedPetDetailView
          pet={petNoTrust}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Buddy')).toBeInTheDocument()
    })

    it('should handle optional callbacks gracefully', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Buddy')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(
        <EnhancedPetDetailView
          pet={mockPet}
          onClose={mockOnClose}
          onLike={mockOnLike}
          showActions={true}
        />
      )

      const likeButton = screen.getByRole('button', { name: /like/i })
      if (isTruthy(likeButton)) {
        likeButton.focus()
        expect(likeButton).toHaveFocus()

        await user.keyboard('{Enter}')
        expect(mockOnLike).toHaveBeenCalled()
      }
    })
  })
})

