import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommunityView from '../CommunityView'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    useSharedValue: vi.fn(() => ({ value: 0 })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((v) => v),
    withTiming: vi.fn((v) => v),
    withRepeat: vi.fn((v) => v),
    withSequence: vi.fn((v) => v),
    interpolate: vi.fn((v) => v),
    Extrapolation: {
      CLAMP: 'clamp'
    }
  },
  useSharedValue: vi.fn(() => ({ value: 0 })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v) => v),
  withTiming: vi.fn((v) => v),
  withRepeat: vi.fn((v) => v),
  withSequence: vi.fn((v) => v),
  interpolate: vi.fn((v) => v),
  Extrapolation: {
    CLAMP: 'clamp'
  }
}))

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>{children}</div>
  )
}))

vi.mock('@/effects/reanimated/use-page-transition', () => ({
  usePageTransition: vi.fn(() => ({
    style: {}
  }))
}))

vi.mock('@/effects/reanimated/use-hover-lift', () => ({
  useHoverLift: vi.fn(() => ({
    animatedStyle: {},
    handleEnter: vi.fn(),
    handleLeave: vi.fn()
  }))
}))

vi.mock('@/effects/reanimated/transitions', () => ({
  springConfigs: {
    smooth: {}
  },
  timingConfigs: {
    smooth: {},
    fast: {}
  }
}))

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      community: {
        title: 'Community',
        feed: 'Feed',
        createPost: 'Create Post',
        refreshed: 'Feed refreshed!',
        refreshError: 'Failed to refresh',
        trending: 'Trending Today',
        forYou: 'For You',
        following: 'Following',
        noPosts: 'No posts yet',
        noPostsDesc: 'Be the first to share something amazing!',
        noFollowingPosts: 'Follow some pets to see their posts here!',
        endOfFeed: "You're all caught up! 🎉"
      },
      adoption: {
        title: 'Adoption',
        subtitle: 'Find your perfect companion',
        noProfiles: 'No pets available for adoption',
        noProfilesDesc: 'Check back soon for pets looking for their forever homes.',
        endOfList: "You've seen all available pets! 🐾"
      },
      common: {
        loading: 'Loading...'
      }
    }
  }))
}))

vi.mock('@/api/community-api', () => ({
  communityAPI: {
    getFeed: vi.fn(() => Promise.resolve({ posts: [], hasMore: false, nextCursor: undefined })),
    getTrendingTags: vi.fn(() => Promise.resolve([]))
  }
}))

vi.mock('@/api/adoption-api', () => ({
  adoptionAPI: {
    getAdoptionProfiles: vi.fn(() => Promise.resolve({ profiles: [], hasMore: false, nextCursor: undefined }))
  }
}))

vi.mock('@/api/lost-found-api', () => ({
  lostFoundAPI: {
    getLostAlerts: vi.fn(() => Promise.resolve([])),
    createSighting: vi.fn(() => Promise.resolve({}))
  }
}))

vi.mock('@/lib/community-service', () => ({
  communityService: {
    getFeed: vi.fn(() => Promise.resolve({ posts: [], hasMore: false, nextCursor: undefined })),
    getTrendingTags: vi.fn(() => Promise.resolve([]))
  }
}))

vi.mock('@/lib/adoption-service', () => ({
  adoptionService: {
    getAdoptionProfiles: vi.fn(() => Promise.resolve({ profiles: [], hasMore: false, nextCursor: undefined }))
  }
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    selection: vi.fn(),
    trigger: vi.fn()
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@github/spark/hooks', () => ({
  useKV: vi.fn(() => [[], vi.fn()])
}))

vi.mock('@/components/adoption/AdoptionCard', () => ({
  default: ({ profile }: { profile: { _id: string } }) => <div data-testid={`adoption-card-${profile._id}`}>Adoption Card</div>
}))

vi.mock('@/components/adoption/AdoptionDetailDialog', () => ({
  default: () => null
}))

vi.mock('@/components/community/PostCard', () => ({
  default: ({ post }: { post: { id: string } }) => <div data-testid={`post-card-${post.id}`}>Post Card</div>
}))

vi.mock('@/components/community/PostComposer', () => ({
  default: () => null
}))

vi.mock('@/components/community/RankingSkeleton', () => ({
  default: () => <div data-testid="ranking-skeleton">Loading...</div>
}))

vi.mock('@/components/lost-found/CreateLostAlertDialog', () => ({
  default: () => null
}))

vi.mock('@/components/maps/LostFoundMap', () => ({
  default: () => <div data-testid="lost-found-map">Lost Found Map</div>
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }))
}))

vi.mock('@/lib/lost-found-types', () => ({}))
vi.mock('@/lib/maps/types', () => ({}))

describe('CommunityView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render community view with header', async () => {
      render(<CommunityView />)
      
      await waitFor(() => {
        expect(screen.getByText('Community')).toBeInTheDocument()
      })
    })

    it('should render feed and adoption tabs', async () => {
      render(<CommunityView />)
      
      await waitFor(() => {
        expect(screen.getByText('Feed')).toBeInTheDocument()
        expect(screen.getByText('Adoption')).toBeInTheDocument()
      })
    })

    it('should render create post button when feed tab is active', async () => {
      render(<CommunityView />)
      
      await waitFor(() => {
        const createButton = screen.getByText(/Create Post|Post/)
        expect(createButton).toBeInTheDocument()
      })
    })
  })

  describe('Tab Switching', () => {
    it('should switch between feed and adoption tabs', async () => {
      const user = userEvent.setup()
      render(<CommunityView />)
      
      await waitFor(() => {
        expect(screen.getByText('Feed')).toBeInTheDocument()
      })
      
      const adoptionTab = screen.getByText('Adoption')
      await user.click(adoptionTab)
      
      await waitFor(() => {
        expect(adoptionTab).toHaveAttribute('data-state', 'active')
      })
    })
  })

  describe('Feed Functionality', () => {
    it('should load feed on mount', async () => {
      const { communityAPI } = await import('@/api/community-api')
      render(<CommunityView />)
      
      await waitFor(() => {
        expect(communityAPI.getFeed).toHaveBeenCalled()
      })
    })
  })

  describe('Adoption Functionality', () => {
    it('should load adoption profiles when adoption tab is selected', async () => {
      const user = userEvent.setup()
      const { adoptionAPI } = await import('@/api/adoption-api')
      render(<CommunityView />)
      
      await waitFor(() => {
        expect(screen.getByText('Adoption')).toBeInTheDocument()
      })
      
      const adoptionTab = screen.getByText('Adoption')
      await user.click(adoptionTab)
      
      await waitFor(() => {
        expect(adoptionAPI.getAdoptionProfiles).toHaveBeenCalled()
      })
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no posts', async () => {
      render(<CommunityView />)
      
      await waitFor(() => {
        expect(screen.getByText('No posts yet')).toBeInTheDocument()
      })
    })

    it('should show empty state when no adoption profiles', async () => {
      const user = userEvent.setup()
      render(<CommunityView />)
      
      await waitFor(() => {
        expect(screen.getByText('Adoption')).toBeInTheDocument()
      })
      
      const adoptionTab = screen.getByText('Adoption')
      await user.click(adoptionTab)
      
      await waitFor(() => {
        expect(screen.getByText('No pets available for adoption')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', async () => {
      render(<CommunityView />)
      
      await waitFor(() => {
        const tabs = screen.getByRole('tablist')
        expect(tabs).toBeInTheDocument()
      })
    })
  })
})

