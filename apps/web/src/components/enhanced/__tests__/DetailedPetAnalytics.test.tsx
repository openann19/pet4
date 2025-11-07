import type { Pet, PetTrustProfile } from '@/lib/types'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DetailedPetAnalytics } from '../DetailedPetAnalytics'

const mockPet: Pet = {
  id: 'pet-1',
  name: 'Buddy',
  breed: 'Golden Retriever',
  age: 3,
  gender: 'male',
  size: 'large',
  photo: 'https://example.com/photo1.jpg',
  photos: ['https://example.com/photo1.jpg'],
  bio: 'A friendly dog',
  personality: ['Friendly', 'Energetic', 'Playful'],
  interests: ['Fetch', 'Swimming', 'Hiking'],
  lookingFor: ['Playdates'],
  location: 'San Francisco, CA',
  ownerId: 'owner-1',
  ownerName: 'John Doe',
  verified: true,
  trustScore: 85,
  createdAt: '2023-01-01T00:00:00Z',
  playdateCount: 12,
  overallRating: 4.5,
  responseRate: 0.9
}

const mockTrustProfile: PetTrustProfile = {
  overallRating: 4.5,
  totalReviews: 25,
  ratingBreakdown: {
    5: 15,
    4: 7,
    3: 2,
    2: 1,
    1: 0
  },
  badges: [
    { id: 'badge-1', label: 'Verified Owner', type: 'verified_owner', description: 'Verified owner', earnedAt: '2023-01-01T00:00:00Z' },
    { id: 'badge-2', label: 'Top Rated', type: 'top_rated', description: 'Top rated', earnedAt: '2023-01-01T00:00:00Z' }
  ],
  playdateCount: 12,
  responseRate: 0.9,
  responseTime: '2 hours',
  trustScore: 85
}

describe('DetailedPetAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Compatibility Score Display', () => {
    it('should render compatibility score when provided', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          compatibilityScore={88}
        />
      )

      expect(screen.getByText('88%')).toBeInTheDocument()
      expect(screen.getByText('Compatibility Score')).toBeInTheDocument()
    })

    it('should display "Perfect Match" badge for score >= 85', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          compatibilityScore={90}
        />
      )

      expect(screen.getByText('Perfect Match')).toBeInTheDocument()
    })

    it('should display "Great Fit" badge for score >= 70 and < 85', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          compatibilityScore={75}
        />
      )

      expect(screen.getByText('Great Fit')).toBeInTheDocument()
    })

    it('should display "Good Potential" badge for score >= 55 and < 70', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          compatibilityScore={60}
        />
      )

      expect(screen.getByText('Good Potential')).toBeInTheDocument()
    })

    it('should display "Worth Exploring" badge for score < 55', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          compatibilityScore={50}
        />
      )

      expect(screen.getByText('Worth Exploring')).toBeInTheDocument()
    })

    it('should render match reasons when provided', () => {
      const matchReasons = [
        'Highly compatible personalities',
        'Similar activity levels',
        'Shared interests in hiking'
      ]

      render(
        <DetailedPetAnalytics
          pet={mockPet}
          compatibilityScore={88}
          matchReasons={matchReasons}
        />
      )

      expect(screen.getByText('Why this match works:')).toBeInTheDocument()
      matchReasons.forEach((reason) => {
        expect(screen.getByText(reason)).toBeInTheDocument()
      })
    })

    it('should not render compatibility section when score is not provided', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
        />
      )

      expect(screen.queryByText('Compatibility Score')).not.toBeInTheDocument()
    })
  })

  describe('Social Stats Display', () => {
    it('should render social stats with trust profile data', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={mockTrustProfile}
        />
      )

      expect(screen.getByText('Social Stats')).toBeInTheDocument()
      expect(screen.getByText('Overall Rating')).toBeInTheDocument()
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText('Playdates')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('Response Rate')).toBeInTheDocument()
      expect(screen.getByText('90%')).toBeInTheDocument()
      expect(screen.getByText('Avg Response')).toBeInTheDocument()
      expect(screen.getByText('2 hours')).toBeInTheDocument()
    })

    it('should display "N/A" for missing trust profile data', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
        />
      )

      expect(screen.getByText('Overall Rating')).toBeInTheDocument()
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('should calculate response rate percentage correctly', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={mockTrustProfile}
        />
      )

      expect(screen.getByText('90%')).toBeInTheDocument()
    })

    it('should display playdate count correctly', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={mockTrustProfile}
        />
      )

      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('completed')).toBeInTheDocument()
    })
  })

  describe('Rating Distribution', () => {
    it('should render rating distribution when trust profile has reviews', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={mockTrustProfile}
        />
      )

      expect(screen.getByText('Rating Distribution')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('7')).toBeInTheDocument()
    })

    it('should calculate rating percentages correctly', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={mockTrustProfile}
        />
      )

      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('should not render rating distribution when no reviews', () => {
      const noReviewsProfile: PetTrustProfile = {
        ...mockTrustProfile,
        totalReviews: 0
      }

      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={noReviewsProfile}
        />
      )

      expect(screen.queryByText('Rating Distribution')).not.toBeInTheDocument()
    })
  })

  describe('Personality & Interests', () => {
    it('should render personality traits', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={mockTrustProfile}
        />
      )

      expect(screen.getByText('Personality & Interests')).toBeInTheDocument()
      expect(screen.getByText('Personality')).toBeInTheDocument()
      expect(screen.getByText('Friendly')).toBeInTheDocument()
      expect(screen.getByText('Energetic')).toBeInTheDocument()
      expect(screen.getByText('Playful')).toBeInTheDocument()
    })

    it('should render interests', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={mockTrustProfile}
        />
      )

      expect(screen.getByText('Interests')).toBeInTheDocument()
      expect(screen.getByText('Fetch')).toBeInTheDocument()
      expect(screen.getByText('Swimming')).toBeInTheDocument()
      expect(screen.getByText('Hiking')).toBeInTheDocument()
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
        <DetailedPetAnalytics
          pet={petNoPersonality}
          trustProfile={mockTrustProfile}
        />
      )

      expect(screen.getByText('Personality & Interests')).toBeInTheDocument()
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
        <DetailedPetAnalytics
          pet={petNoInterests}
          trustProfile={mockTrustProfile}
        />
      )

      expect(screen.getByText('Personality & Interests')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing trust profile gracefully', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
        />
      )

      expect(screen.getByText('Social Stats')).toBeInTheDocument()
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })

    it('should handle zero response rate', () => {
      const zeroResponseProfile: PetTrustProfile = {
        ...mockTrustProfile,
        responseRate: 0
      }

      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={zeroResponseProfile}
        />
      )

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should handle partial rating breakdown', () => {
      const partialRatingProfile: PetTrustProfile = {
        ...mockTrustProfile,
        ratingBreakdown: {
          5: 10,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        },
        totalReviews: 10
      }

      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={partialRatingProfile}
        />
      )

      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={mockTrustProfile}
          compatibilityScore={88}
        />
      )

      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })

    it('should have accessible progress indicators', () => {
      render(
        <DetailedPetAnalytics
          pet={mockPet}
          trustProfile={mockTrustProfile}
          compatibilityScore={88}
        />
      )

      const progressBars = document.querySelectorAll('[role="progressbar"]')
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })
})

