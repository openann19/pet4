import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MatchesView from '../MatchesView'
import type { Match, Pet } from '@/lib/types'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    useSharedValue: vi.fn((initial: number) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((v) => v),
    withTiming: vi.fn((v) => v),
    withRepeat: vi.fn((v) => v),
    withSequence: vi.fn((v) => v),
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v) => v),
  withTiming: vi.fn((v) => v),
  withRepeat: vi.fn((v) => v),
  withSequence: vi.fn((v) => v),
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
  useBounceOnTap: vi.fn(() => ({
    animatedStyle: {},
    handlePress: vi.fn()
  }))
}))

// Mock hooks
vi.mock('@/hooks/useMatches', () => ({
  useMatches: vi.fn(() => ({
    matchedPets: [],
    userPet: null,
    selectedPet: null,
    selectedMatch: null,
    matchReasoning: [],
    isLoading: false,
    selectPet: vi.fn(),
    clearSelection: vi.fn()
  }))
}))

vi.mock('@/hooks/useCall', () => ({
  useCall: vi.fn(() => ({
    activeCall: null,
    initiateCall: vi.fn(),
    endCall: vi.fn(),
    toggleMute: vi.fn(),
    toggleVideo: vi.fn()
  }))
}))

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      matches: {
        title: 'Matches',
        empty: 'No matches yet'
      }
    }
  }))
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
    success: vi.fn()
  }
}))

vi.mock('@/lib/matching', () => ({
  calculateCompatibility: vi.fn(() => 85),
  getCompatibilityFactors: vi.fn(() => [])
}))

// Mock components
vi.mock('@/components/enhanced/EnhancedPetDetailView', () => ({
  EnhancedPetDetailView: ({ pet }: { pet: Pet }) => (
    <div data-testid="pet-detail-view">{pet.name}</div>
  )
}))

vi.mock('@/components/CompatibilityBreakdown', () => ({
  default: () => <div data-testid="compatibility-breakdown">Compatibility</div>
}))

vi.mock('@/components/playdate/PlaydateScheduler', () => ({
  default: () => <div data-testid="playdate-scheduler">Playdate Scheduler</div>
}))

vi.mock('@/components/call/CallInterface', () => ({
  default: () => <div data-testid="call-interface">Call Interface</div>
}))

const mockUserPet: Pet = {
  id: 'user1',
  name: 'Fluffy',
  species: 'dog',
  breed: 'Golden Retriever',
  age: 3,
  size: 'large'
}

const mockMatchedPet: Pet = {
  id: 'pet1',
  name: 'Buddy',
  species: 'dog',
  breed: 'Labrador',
  age: 2,
  size: 'large'
}

const mockMatch: Match = {
  id: 'match1',
  petId: 'user1',
  matchedPetId: 'pet1',
  matchedAt: new Date().toISOString(),
  status: 'active',
  compatibilityScore: 85
}

describe('MatchesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render matches view', async () => {
      const { useMatches } = await import('@/hooks/useMatches')
      vi.mocked(useMatches).mockReturnValue({
        matchedPets: [],
        userPet: mockUserPet,
        selectedPet: null,
        selectedMatch: null,
        matchReasoning: [],
        isLoading: false,
        selectPet: vi.fn(),
        clearSelection: vi.fn()
      })

      render(<MatchesView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })

    it('should show empty state when no matches', async () => {
      const { useMatches } = await import('@/hooks/useMatches')
      vi.mocked(useMatches).mockReturnValue({
        matchedPets: [],
        userPet: mockUserPet,
        selectedPet: null,
        selectedMatch: null,
        matchReasoning: [],
        isLoading: false,
        selectPet: vi.fn(),
        clearSelection: vi.fn()
      })

      render(<MatchesView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })
  })

  describe('Match Display', () => {
    it('should display matches when available', async () => {
      const { useMatches } = await import('@/hooks/useMatches')
      const selectPet = vi.fn()
      vi.mocked(useMatches).mockReturnValue({
        matchedPets: [{ ...mockMatchedPet, match: mockMatch }],
        userPet: mockUserPet,
        selectedPet: null,
        selectedMatch: null,
        matchReasoning: [],
        isLoading: false,
        selectPet,
        clearSelection: vi.fn()
      })

      render(<MatchesView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })

    it('should show pet detail when match is selected', async () => {
      const { useMatches } = await import('@/hooks/useMatches')
      vi.mocked(useMatches).mockReturnValue({
        matchedPets: [{ ...mockMatchedPet, match: mockMatch }],
        userPet: mockUserPet,
        selectedPet: mockMatchedPet,
        selectedMatch: mockMatch,
        matchReasoning: ['Great match!'],
        isLoading: false,
        selectPet: vi.fn(),
        clearSelection: vi.fn()
      })

      render(<MatchesView />)

      await waitFor(() => {
        expect(screen.getByTestId('pet-detail-view')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should call onNavigateToChat when provided', async () => {
      const { useMatches } = await import('@/hooks/useMatches')
      const onNavigateToChat = vi.fn()
      vi.mocked(useMatches).mockReturnValue({
        matchedPets: [{ ...mockMatchedPet, match: mockMatch }],
        userPet: mockUserPet,
        selectedPet: null,
        selectedMatch: null,
        matchReasoning: [],
        isLoading: false,
        selectPet: vi.fn(),
        clearSelection: vi.fn()
      })

      render(<MatchesView onNavigateToChat={onNavigateToChat} />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })
  })
})

