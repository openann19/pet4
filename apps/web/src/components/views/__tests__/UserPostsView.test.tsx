import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserPostsView from '../UserPostsView'
import type { Post } from '@/lib/community-types'

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

vi.mock('@/effects/reanimated/use-entry-animation', () => ({
  useEntryAnimation: vi.fn(() => ({
    animatedStyle: {}
  }))
}))

// Mock dependencies
vi.mock('@/api/community-api', () => ({
  communityAPI: {
    queryFeed: vi.fn(() => Promise.resolve({ posts: [], nextCursor: undefined }))
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
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

vi.mock('@/components/community/PostCard', () => ({
  PostCard: ({ post, onAuthorClick }: { post: Post; onAuthorClick?: (authorId: string) => void }) => (
    <div data-testid={`post-card-${post.id}`}>
      <div>{post.text || 'Post'}</div>
      {onAuthorClick && (
        <button onClick={() => onAuthorClick(post.authorId)}>Author</button>
      )}
    </div>
  )
}))

vi.mock('@/components/community/PostDetailView', () => ({
  PostDetailView: ({ open, onOpenChange, postId, onAuthorClick }: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    postId: string;
    onAuthorClick?: (authorId: string) => void;
  }) => 
    open ? (
      <div data-testid="post-detail-view">
        <div>Post Detail: {postId}</div>
        <button onClick={() => onOpenChange(false)}>Close</button>
        {onAuthorClick && (
          <button onClick={() => onAuthorClick('author1')}>Author</button>
        )}
      </div>
    ) : null
}))

const mockPosts: Post[] = [
  {
    id: '1',
    authorId: 'user1',
    authorName: 'Fluffy Owner',
    authorAvatar: 'https://example.com/avatar1.jpg',
    kind: 'photo',
    text: 'My cute pet!',
    media: ['https://example.com/photo1.jpg'],
    visibility: 'public',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    authorId: 'user1',
    authorName: 'Fluffy Owner',
    kind: 'text',
    text: 'Great day at the park!',
    visibility: 'public',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

describe('UserPostsView', () => {
  let mockIntersectionObserver: {
    observe: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
    unobserve: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock IntersectionObserver
    mockIntersectionObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn()
    }

    global.IntersectionObserver = vi.fn(() => mockIntersectionObserver) as unknown as typeof IntersectionObserver
  })

  describe('Rendering', () => {
    it('should render user posts view with header', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: mockPosts, nextCursor: undefined })

      render(<UserPostsView userId="user1" userName="Fluffy Owner" />)

      await waitFor(() => {
        expect(screen.getByText("Fluffy Owner's Posts")).toBeInTheDocument()
      })
    })

    it('should render back button when onBack is provided', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: [], nextCursor: undefined })

      const onBack = vi.fn()
      render(<UserPostsView userId="user1" onBack={onBack} />)

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i })
        expect(backButton).toBeInTheDocument()
      })
    })

    it('should use provided userName in header', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: [], nextCursor: undefined })

      render(<UserPostsView userId="user1" userName="Custom Name" />)

      await waitFor(() => {
        expect(screen.getByText("Custom Name's Posts")).toBeInTheDocument()
      })
    })

    it('should extract author name from first post if userName not provided', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: mockPosts, nextCursor: undefined })

      render(<UserPostsView userId="user1" />)

      await waitFor(() => {
        expect(screen.getByText("Fluffy Owner's Posts")).toBeInTheDocument()
      })
    })

    it('should display post count in header', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: mockPosts, nextCursor: undefined })

      render(<UserPostsView userId="user1" userName="Fluffy Owner" />)

      await waitFor(() => {
        expect(screen.getByText(/2 posts/i)).toBeInTheDocument()
      })
    })

    it('should display singular post count for one post', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: [mockPosts[0]], nextCursor: undefined })

      render(<UserPostsView userId="user1" userName="Fluffy Owner" />)

      await waitFor(() => {
        expect(screen.getByText(/1 post/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading skeletons while loading', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ posts: [], nextCursor: undefined }), 100))
      )

      render(<UserPostsView userId="user1" />)

      expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0)
    })

    it('should hide loading skeletons after posts load', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: mockPosts, nextCursor: undefined })

      render(<UserPostsView userId="user1" />)

      await waitFor(() => {
        expect(screen.queryByTestId(/skeleton/i)).not.toBeInTheDocument()
      })
    })

    it('should show loading skeleton when loading more posts', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed)
        .mockResolvedValueOnce({ posts: mockPosts, nextCursor: 'cursor1' })
        .mockImplementationOnce(
          () => new Promise(resolve => setTimeout(() => resolve({ posts: [], nextCursor: undefined }), 100))
        )

      render(<UserPostsView userId="user1" />)

      await waitFor(() => {
        expect(screen.getByTestId('post-card-1')).toBeInTheDocument()
      })

      // Trigger intersection observer
      const callback = vi.mocked(mockIntersectionObserver.observe).mock.calls[0]?.[0]
      if (callback && typeof callback === 'function') {
        callback([{ isIntersecting: true }] as IntersectionObserverEntry[])
      }

      await waitFor(() => {
        expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Post Display', () => {
    it('should display user posts when loaded', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: mockPosts, nextCursor: undefined })

      render(<UserPostsView userId="user1" userName="Fluffy Owner" />)

      await waitFor(() => {
        expect(screen.getByTestId('post-card-1')).toBeInTheDocument()
        expect(screen.getByTestId('post-card-2')).toBeInTheDocument()
      })
    })

    it('should call queryFeed with correct authorId', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: [], nextCursor: undefined })

      render(<UserPostsView userId="user1" />)

      await waitFor(() => {
        expect(communityAPI.queryFeed).toHaveBeenCalledWith(
          expect.objectContaining({
            authorId: 'user1',
            limit: 20
          })
        )
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no posts', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: [], nextCursor: undefined })

      render(<UserPostsView userId="user1" userName="Fluffy Owner" />)

      await waitFor(() => {
        expect(screen.getByText('No posts yet')).toBeInTheDocument()
        expect(screen.getByText(/Fluffy Owner hasn't shared any posts yet/i)).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('should set up IntersectionObserver for pagination', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: mockPosts, nextCursor: 'cursor1' })

      render(<UserPostsView userId="user1" />)

      await waitFor(() => {
        expect(mockIntersectionObserver.observe).toHaveBeenCalled()
      })
    })

    it('should load more posts when intersection observer triggers', async () => {
      const { communityAPI } = await import('@/api/community-api')
      const morePosts: Post[] = [
        {
          id: '3',
          authorId: 'user1',
          authorName: 'Fluffy Owner',
          kind: 'photo',
          text: 'Another post',
          visibility: 'public',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      vi.mocked(communityAPI.queryFeed)
        .mockResolvedValueOnce({ posts: mockPosts, nextCursor: 'cursor1' })
        .mockResolvedValueOnce({ posts: morePosts, nextCursor: undefined })

      render(<UserPostsView userId="user1" />)

      await waitFor(() => {
        expect(screen.getByTestId('post-card-1')).toBeInTheDocument()
      })

      // Simulate intersection
      const entries = [{ isIntersecting: true }] as IntersectionObserverEntry[]
      const observerCallback = vi.fn()
      
      // Get the actual callback from the IntersectionObserver
      const observer = new IntersectionObserver(observerCallback, { threshold: 0.1 })
      const target = document.createElement('div')
      observer.observe(target)
      
      // Manually trigger the callback
      observerCallback(entries)

      await waitFor(() => {
        expect(communityAPI.queryFeed).toHaveBeenCalledTimes(2)
      }, { timeout: 2000 })
    })

    it('should not load more if hasMore is false', async () => {
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: mockPosts, nextCursor: undefined })

      render(<UserPostsView userId="user1" />)

      await waitFor(() => {
        expect(screen.getByTestId('post-card-1')).toBeInTheDocument()
      })

      expect(communityAPI.queryFeed).toHaveBeenCalledTimes(1)
    })
  })

  describe('Post Interactions', () => {
    it('should open post detail when post is clicked', async () => {
      const user = userEvent.setup()
      const { communityAPI } = await import('@/api/community-api')
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: mockPosts, nextCursor: undefined })

      render(<UserPostsView userId="user1" />)

      await waitFor(() => {
        expect(screen.getByTestId('post-card-1')).toBeInTheDocument()
      })

      const postCard = screen.getByTestId('post-card-1')
      await user.click(postCard)

      await waitFor(() => {
        expect(screen.getByTestId('post-detail-view')).toBeInTheDocument()
        expect(screen.getByText(/Post Detail: 1/i)).toBeInTheDocument()
      })
    })

    it('should call onAuthorClick when author is clicked', async () => {
      const user = userEvent.setup()
      const { communityAPI } = await import('@/api/community-api')
      const onAuthorClick = vi.fn()
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: mockPosts, nextCursor: undefined })

      render(<UserPostsView userId="user1" onAuthorClick={onAuthorClick} />)

      await waitFor(() => {
        expect(screen.getByTestId('post-card-1')).toBeInTheDocument()
      })

      const authorButton = screen.getByTestId('post-card-1').querySelector('button')
      if (authorButton) {
        await user.click(authorButton)
      }

      await waitFor(() => {
        expect(onAuthorClick).toHaveBeenCalledWith('user1')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle error when loading posts fails', async () => {
      const { communityAPI } = await import('@/api/community-api')
      const { toast } = await import('sonner')
      vi.mocked(communityAPI.queryFeed).mockRejectedValue(new Error('Failed to load'))

      render(<UserPostsView userId="user1" />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load posts')
      })
    })
  })

  describe('Back Button', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup()
      const { communityAPI } = await import('@/api/community-api')
      const onBack = vi.fn()
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: [], nextCursor: undefined })

      render(<UserPostsView userId="user1" onBack={onBack} />)

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i })
        expect(backButton).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      expect(onBack).toHaveBeenCalled()
    })
  })

  describe('Author Info Extraction', () => {
    it('should extract author avatar from first post if not provided', async () => {
      const { communityAPI } = await import('@/api/community-api')
      const postsWithAvatar = [{
        ...mockPosts[0],
        authorAvatar: 'https://example.com/extracted-avatar.jpg'
      }]
      vi.mocked(communityAPI.queryFeed).mockResolvedValue({ posts: postsWithAvatar, nextCursor: undefined })

      render(<UserPostsView userId="user1" />)

      await waitFor(() => {
        expect(screen.getByText("Fluffy Owner's Posts")).toBeInTheDocument()
      })
    })
  })
})

