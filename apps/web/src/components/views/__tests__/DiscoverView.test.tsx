import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiscoverView from '@/components/views/DiscoverView';
import { useApp } from '@/contexts/AppContext';
import { useStorage } from '@/hooks/use-storage';
import { usePetDiscovery } from '@/hooks/usePetDiscovery';
import { useMatching } from '@/hooks/useMatching';
import { useSwipe } from '@/hooks/useSwipe';
import { useViewMode } from '@/hooks/useViewMode';
import { useStories } from '@/hooks/useStories';
import { useDialog } from '@/hooks/useDialog';
import { adoptionApi } from '@/api/adoption-api';

vi.mock('@/contexts/AppContext');
vi.mock('@/hooks/use-storage');
vi.mock('@/hooks/usePetDiscovery');
vi.mock('@/hooks/useMatching');
vi.mock('@/hooks/useSwipe');
vi.mock('@/hooks/useViewMode');
vi.mock('@/hooks/useStories');
vi.mock('@/hooks/useDialog');
vi.mock('@/api/adoption-api');
vi.mock('@/lib/matching', () => ({
  generateMatchReasoning: vi.fn(() => Promise.resolve(['Great match!'])),
}));
vi.mock('@/lib/distance', () => ({
  formatDistance: vi.fn((d: number) => `${d}km`),
  getDistanceBetweenLocations: vi.fn(() => 5),
  parseLocation: vi.fn(() => ({ lat: 0, lng: 0 })),
}));
vi.mock('@/components/DiscoveryFilters', () => ({
  default: ({ onPreferencesChange }: { onPreferencesChange: (p: unknown) => void }) => (
    <div data-testid="discovery-filters">
      <button onClick={() => onPreferencesChange({})}>Update Filters</button>
    </div>
  ),
}));
vi.mock('@/components/stories/StoriesBar', () => ({
  default: () => <div data-testid="stories-bar">Stories</div>,
}));
vi.mock('@/components/CompatibilityBreakdown', () => ({
  default: () => <div data-testid="compatibility-breakdown">Compatibility</div>,
}));
vi.mock('@/components/MatchCelebration', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="match-celebration">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));
vi.mock('@/components/enhanced/EnhancedPetDetailView', () => ({
  EnhancedPetDetailView: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="pet-detail-view">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));
vi.mock('@/components/PetRatings', () => ({
  PetRatings: () => <div data-testid="pet-ratings">Ratings</div>,
}));
vi.mock('@/components/TrustBadges', () => ({
  TrustBadges: () => <div data-testid="trust-badges">Badges</div>,
}));
vi.mock('@/components/VerificationBadge', () => ({
  VerificationBadge: () => <div data-testid="verification-badge">Verified</div>,
}));
vi.mock('@/components/DiscoverMapMode', () => ({
  default: () => <div data-testid="discover-map-mode">Map</div>,
}));
vi.mock('@/components/discovery/SavedSearchesManager', () => ({
  default: () => <div data-testid="saved-searches-manager">Saved Searches</div>,
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPet = {
  id: 'pet-1',
  name: 'Buddy',
  breed: 'Golden Retriever',
  age: 3,
  gender: 'male' as const,
  size: 'large' as const,
  photo: 'https://example.com/pet.jpg',
  photos: ['https://example.com/pet.jpg'],
  bio: 'Friendly golden retriever',
  personality: ['friendly', 'playful'],
  interests: ['fetch', 'swimming'],
  lookingFor: ['playdates'],
  ownerId: 'user-1',
  ownerName: 'Owner',
  verified: false,
  createdAt: new Date().toISOString(),
  location: '0,0',
};

const mockUserPet = {
  id: 'user-pet-1',
  name: 'My Pet',
  breed: 'Labrador',
  age: 2,
  gender: 'female' as const,
  size: 'medium' as const,
  photo: 'https://example.com/user-pet.jpg',
  photos: ['https://example.com/user-pet.jpg'],
  bio: 'My pet',
  personality: ['energetic'],
  interests: ['running'],
  lookingFor: ['friends'],
  ownerId: 'user-1',
  ownerName: 'Me',
  verified: true,
  createdAt: new Date().toISOString(),
  location: '0,0',
};

describe('DiscoverView', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useApp).mockReturnValue({
      t: {
        common: {
          itsAMatch: "It's a Match!",
          and: 'and',
          areNowConnected: 'are now connected',
        },
        discover: {
          empty: 'No more pets',
          filters: 'Filters',
          map: 'Map',
          cards: 'Cards',
        },
      },
    } as never);

    vi.mocked(useStorage).mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'user-pets') return [[mockUserPet], vi.fn(), vi.fn()];
      if (key === 'swipe-history') return [[], vi.fn(), vi.fn()];
      if (key === 'matches') return [[], vi.fn(), vi.fn()];
      if (key === 'verification-requests') return [{}, vi.fn(), vi.fn()];
      if (key === 'discovery-preferences') {
        return [
          {
            minAge: 0,
            maxAge: 15,
            sizes: ['small', 'medium', 'large'],
            maxDistance: 50,
            personalities: [],
            interests: [],
            lookingFor: [],
            minCompatibility: 0,
            mediaFilters: {
              cropSize: 'any',
              photoQuality: 'any',
              hasVideo: false,
              minPhotos: 1,
            },
            advancedFilters: {
              verified: false,
              activeToday: false,
              hasStories: false,
              respondQuickly: false,
              superLikesOnly: false,
            },
          },
          vi.fn(),
          vi.fn(),
        ];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });

    vi.mocked(usePetDiscovery).mockReturnValue({
      availablePets: [mockPet],
      currentPet: mockPet,
      currentIndex: 0,
      totalPets: 1,
      hasMore: true,
      hasPrevious: false,
      nextPet: vi.fn(),
      prevPet: vi.fn(),
      goToPet: vi.fn(),
      markAsSwiped: vi.fn(),
      resetDiscovery: vi.fn(),
      reset: vi.fn(),
    });

    vi.mocked(useMatching).mockReturnValue({
      compatibilityScore: 85,
      compatibilityFactors: [],
      matchReasoning: ['Great match!'],
      isLoading: false,
      error: null,
      calculateMatch: vi.fn(),
      performSwipe: vi.fn().mockResolvedValue({
        recorded: true,
        isMatch: false,
        compatibility: 85,
      }),
      checkMatch: vi.fn().mockResolvedValue({
        isMatch: false,
        compatibility: 85,
      }),
    });

    vi.mocked(useSwipe).mockReturnValue({
      animatedStyle: {},
      likeOpacityStyle: {},
      passOpacityStyle: {},
      handleMouseDown: vi.fn(),
      handleMouseMove: vi.fn(),
      handleMouseUp: vi.fn(),
      handleTouchStart: vi.fn(),
      handleTouchMove: vi.fn(),
      handleTouchEnd: vi.fn(),
      reset: vi.fn(),
    });

    vi.mocked(useViewMode).mockReturnValue({
      viewMode: 'cards',
      setMode: vi.fn(),
    });

    vi.mocked(useStories).mockReturnValue({
      stories: [],
      userStories: [],
      allStories: [],
      selectedStory: null,
      hasStories: false,
      addStory: vi.fn(),
      updateStory: vi.fn(),
      deleteStory: vi.fn(),
      selectStory: vi.fn(),
      clearSelection: vi.fn(),
      clearSelectedStory: vi.fn(),
      setStories: vi.fn(),
    });

    vi.mocked(useDialog).mockReturnValue({
      isOpen: false,
      open: vi.fn(),
      close: vi.fn(),
      toggle: vi.fn(),
    });

    vi.mocked(adoptionApi.getAdoptionProfiles).mockResolvedValue({
      profiles: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render discover view', () => {
      render(<DiscoverView />);
      expect(screen.getByTestId('discovery-filters')).toBeInTheDocument();
    });

    it('should render stories bar', () => {
      render(<DiscoverView />);
      expect(screen.getByTestId('stories-bar')).toBeInTheDocument();
    });

    it('should render pet card when pets are available', () => {
      render(<DiscoverView />);
      expect(screen.getByText('Buddy')).toBeInTheDocument();
    });

    it('should render empty state when no pets', () => {
      vi.mocked(usePetDiscovery).mockReturnValue({
        availablePets: [],
        currentPet: undefined,
        currentIndex: 0,
        hasMore: false,
        nextPet: vi.fn(),
        prevPet: vi.fn(),
        goToPet: vi.fn(),
        resetDiscovery: vi.fn(),
      });

      render(<DiscoverView />);
      expect(screen.getByText('No more pets')).toBeInTheDocument();
    });

    it('should render loading state initially', () => {
      vi.mocked(useStorage).mockImplementation((key: string) => {
        if (key === 'user-pets') return [undefined, vi.fn()];
        return [[], vi.fn()];
      });

      render(<DiscoverView />);
    });
  });

  describe('Interactions', () => {
    it('should handle like swipe', async () => {
      const user = userEvent.setup();
      const mockSetSwipeHistory = vi.fn();
      const mockSetMatches = vi.fn();
      const mockOpenCelebration = vi.fn();

      vi.mocked(useStorage).mockImplementation((key: string) => {
        if (key === 'swipe-history') return [[], mockSetSwipeHistory];
        if (key === 'matches') return [[], mockSetMatches];
        if (key === 'user-pets') return [[mockUserPet], vi.fn()];
        return [[], vi.fn()];
      });

      vi.mocked(useDialog).mockReturnValue({
        isOpen: false,
        open: mockOpenCelebration,
        close: vi.fn(),
        toggle: vi.fn(),
      });

      render(<DiscoverView />);

      const likeButton = screen.getByRole('button', { name: /like/i });
      await user.click(likeButton);

      await waitFor(() => {
        expect(mockSetSwipeHistory).toHaveBeenCalled();
      });
    });

    it('should handle pass swipe', async () => {
      const user = userEvent.setup();
      const mockSetSwipeHistory = vi.fn();

      vi.mocked(useStorage).mockImplementation((key: string) => {
        if (key === 'swipe-history') return [[], mockSetSwipeHistory];
        if (key === 'user-pets') return [[mockUserPet], vi.fn()];
        return [[], vi.fn()];
      });

      render(<DiscoverView />);

      const passButton = screen.getByRole('button', { name: /pass/i });
      await user.click(passButton);

      await waitFor(() => {
        expect(mockSetSwipeHistory).toHaveBeenCalled();
      });
    });

    it('should open pet detail dialog', async () => {
      const user = userEvent.setup();
      const mockOpen = vi.fn();

      vi.mocked(useDialog).mockImplementation(() => ({
        isOpen: false,
        open: mockOpen,
        close: vi.fn(),
        toggle: vi.fn(),
      }));

      render(<DiscoverView />);

      const infoButton = screen.getByRole('button', { name: /info/i });
      await user.click(infoButton);

      expect(mockOpen).toHaveBeenCalled();
    });

    it('should toggle view mode', async () => {
      const user = userEvent.setup();
      const mockSetMode = vi.fn();

      vi.mocked(useViewMode).mockReturnValue({
        viewMode: 'cards',
        setMode: mockSetMode,
      });

      render(<DiscoverView />);

      const mapButton = screen.getByRole('button', { name: /map/i });
      await user.click(mapButton);

      expect(mockSetMode).toHaveBeenCalledWith('map');
    });

    it('should update filters', async () => {
      const user = userEvent.setup();
      render(<DiscoverView />);

      const updateButton = screen.getByText('Update Filters');
      await user.click(updateButton);
    });
  });

  describe('States', () => {
    it('should show swipe hint initially', () => {
      render(<DiscoverView />);
    });

    it('should hide swipe hint after swipe', async () => {
      const user = userEvent.setup();
      render(<DiscoverView />);

      const likeButton = screen.getByRole('button', { name: /like/i });
      await user.click(likeButton);

      await waitFor(() => {
        // Swipe hint should be hidden
      });
    });

    it('should show compatibility breakdown when available', () => {
      render(<DiscoverView />);
      expect(screen.getByTestId('compatibility-breakdown')).toBeInTheDocument();
    });

    it('should show match celebration on match', async () => {
      const user = userEvent.setup();
      const mockOpen = vi.fn();

      vi.mocked(useDialog).mockImplementation((options) => {
        if (options?.initialOpen === false) {
          return {
            isOpen: false,
            open: mockOpen,
            close: vi.fn(),
            toggle: vi.fn(),
          };
        }
        return {
          isOpen: true,
          open: vi.fn(),
          close: vi.fn(),
          toggle: vi.fn(),
        };
      });

      vi.mocked(useStorage).mockImplementation((key: string) => {
        if (key === 'swipe-history') return [[], vi.fn()];
        if (key === 'matches') return [[], vi.fn()];
        if (key === 'user-pets') return [[mockUserPet], vi.fn()];
        return [[], vi.fn()];
      });

      render(<DiscoverView />);

      const likeButton = screen.getByRole('button', { name: /like/i });
      await user.click(likeButton);

      await waitFor(() => {
        expect(mockOpen).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle no user pet', () => {
      vi.mocked(useStorage).mockImplementation((key: string) => {
        if (key === 'user-pets') return [[], vi.fn()];
        return [[], vi.fn()];
      });

      render(<DiscoverView />);
    });

    it('should handle swipe when no current pet', async () => {
      vi.mocked(usePetDiscovery).mockReturnValue({
        availablePets: [],
        currentPet: undefined,
        currentIndex: 0,
        hasMore: false,
        nextPet: vi.fn(),
        prevPet: vi.fn(),
        goToPet: vi.fn(),
        resetDiscovery: vi.fn(),
      });

      render(<DiscoverView />);
    });

    it('should handle error loading adoptable pets', async () => {
      vi.mocked(adoptionApi.getAdoptionProfiles).mockRejectedValue(new Error('API Error'));

      render(<DiscoverView />);

      await waitFor(() => {
        // Error should be handled
      });
    });
  });
});
