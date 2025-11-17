import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdoptionView from '../AdoptionView'
import type { AdoptionListing } from '@/lib/adoption-marketplace-types'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    useSharedValue: vi.fn((initial: number) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((v) => v),
    withTiming: vi.fn((v) => v),
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v) => v),
  withTiming: vi.fn((v) => v),
}))

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>{children}</div>
  )
}))

vi.mock('@/effects/reanimated/use-animate-presence', () => ({
  useAnimatePresence: vi.fn(() => ({
    shouldRender: true,
    animatedStyle: {}
  }))
}))

vi.mock('@/effects/reanimated/use-hover-lift', () => ({
  useHoverLift: vi.fn(() => ({
    animatedStyle: {},
    handleEnter: vi.fn(),
    handleLeave: vi.fn()
  }))
}))

vi.mock('@/effects/reanimated/use-bounce-on-tap', () => ({
  usePressBounce: vi.fn(() => ({
    animatedStyle: {},
    handlePress: vi.fn()
  }))
}))

// Mock hooks
vi.mock('@/hooks/useStorage', () => ({
  useStorage: vi.fn((key: string, defaultValue: unknown) => {
    const storage: Record<string, unknown> = {
      'adoption-favorites': []
    }
    const setValue = vi.fn()
    return [storage[key] ?? defaultValue, setValue]
  })
}))

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      adoption: {
        title: 'Adoption'
      }
    }
  }))
}))

vi.mock('@/api/adoption-api', () => ({
  adoptionApi: {
    getAdoptionProfiles: vi.fn(() => Promise.resolve({ profiles: [], nextCursor: undefined })),
    getUserApplications: vi.fn(() => Promise.resolve([]))
  }
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }))
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock global spark
global.spark = {
  user: vi.fn(() => Promise.resolve({ id: 'user1' }))
} as unknown as typeof global.spark

// Mock components
vi.mock('@/components/adoption/AdoptionListingCard', () => ({
  AdoptionListingCard: ({ listing }: { listing: AdoptionListing }) => (
    <div data-testid={`listing-${listing.id}`}>{listing.petName}</div>
  )
}))

vi.mock('@/components/adoption/AdoptionListingDetailDialog', () => ({
  AdoptionListingDetailDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="listing-detail-dialog">Detail Dialog</div> : null
}))

vi.mock('@/components/adoption/CreateAdoptionListingDialog', () => ({
  CreateAdoptionListingDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-listing-dialog">Create Dialog</div> : null
}))

vi.mock('@/components/adoption/MyApplicationsView', () => ({
  MyApplicationsView: () => <div data-testid="my-applications">My Applications</div>
}))

const mockListing: AdoptionListing = {
  id: 'listing1',
  ownerId: 'owner1',
  ownerName: 'Shelter Name',
  petId: 'pet1',
  petName: 'Buddy',
  petBreed: 'Labrador',
  petAge: 2,
  petGender: 'male',
  petSize: 'large',
  petSpecies: 'dog',
  petPhotos: ['https://example.com/photo.jpg'],
  petDescription: 'Friendly dog',
  status: 'active',
  location: { city: 'San Francisco', country: 'USA' },
  requirements: [],
  vetDocuments: [],
  vaccinated: true,
  spayedNeutered: true,
  microchipped: false,
  goodWithKids: true,
  goodWithPets: true,
  energyLevel: 'medium',
  temperament: 'friendly',
  reasonForAdoption: 'Looking for home',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  viewsCount: 0,
  applicationsCount: 0,
  featured: false
}

describe('AdoptionView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render adoption view', async () => {
      const { adoptionApi } = await import('@/api/adoption-api')
      vi.mocked(adoptionApi.getAdoptionProfiles).mockResolvedValue({ profiles: [], nextCursor: undefined })
      vi.mocked(adoptionApi.getUserApplications).mockResolvedValue([])

      render(<AdoptionView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })

    it('should display listings when loaded', async () => {
      const { adoptionApi } = await import('@/api/adoption-api')
      vi.mocked(adoptionApi.getAdoptionProfiles).mockResolvedValue({
        profiles: [{
          _id: 'listing1',
          petId: 'pet1',
          petName: 'Buddy',
          breed: 'Labrador',
          age: 2,
          gender: 'male',
          size: 'large',
          photos: ['https://example.com/photo.jpg'],
          description: 'Friendly dog',
          status: 'available',
          location: 'San Francisco, USA',
          vaccinated: true,
          spayedNeutered: true,
          goodWithKids: true,
          goodWithPets: true,
          energyLevel: 'medium',
          personality: 'friendly',
          postedDate: new Date().toISOString(),
          shelterId: 'owner1',
          shelterName: 'Shelter Name'
        }],
        nextCursor: undefined
      })
      vi.mocked(adoptionApi.getUserApplications).mockResolvedValue([])

      render(<AdoptionView />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-listing1')).toBeInTheDocument()
      })
    })
  })

  describe('Tabs', () => {
    it('should switch between view modes', async () => {
      const user = userEvent.setup()
      const { adoptionApi } = await import('@/api/adoption-api')
      vi.mocked(adoptionApi.getAdoptionProfiles).mockResolvedValue({ profiles: [], nextCursor: undefined })
      vi.mocked(adoptionApi.getUserApplications).mockResolvedValue([])

      render(<AdoptionView />)

      await waitFor(() => {
        expect(screen.getByText(/My Applications/i)).toBeInTheDocument()
      })

      const applicationsTab = screen.getByText(/My Applications/i)
      await user.click(applicationsTab)

      await waitFor(() => {
        expect(screen.getByTestId('my-applications')).toBeInTheDocument()
      })
    })
  })

  describe('Search', () => {
    it('should filter listings by search query', async () => {
      const user = userEvent.setup()
      const { adoptionApi } = await import('@/api/adoption-api')
      vi.mocked(adoptionApi.getAdoptionProfiles).mockResolvedValue({
        profiles: [{
          _id: 'listing1',
          petId: 'pet1',
          petName: 'Buddy',
          breed: 'Labrador',
          age: 2,
          gender: 'male',
          size: 'large',
          photos: [],
          description: 'Friendly dog',
          status: 'available',
          location: 'San Francisco, USA',
          vaccinated: true,
          spayedNeutered: true,
          goodWithKids: true,
          goodWithPets: true,
          energyLevel: 'medium',
          personality: 'friendly',
          postedDate: new Date().toISOString(),
          shelterId: 'owner1',
          shelterName: 'Shelter Name'
        }],
        nextCursor: undefined
      })
      vi.mocked(adoptionApi.getUserApplications).mockResolvedValue([])

      render(<AdoptionView />)

      await waitFor(() => {
        expect(screen.getByTestId('listing-listing1')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'Buddy')

      await waitFor(() => {
        expect(searchInput).toHaveValue('Buddy')
      })
    })
  })
})

