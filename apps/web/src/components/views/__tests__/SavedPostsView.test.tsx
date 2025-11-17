import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SavedPostsView from '../SavedPostsView'
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
vi.mock('@/lib/community-service', () => ({
  communityService: {
    getSavedPosts: vi.fn(() => Promise.resolve([]))
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
    authorId: 'author1',
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
    authorId: 'author2',
    authorName: 'Buddy Parent',
    kind: 'text',
    text: 'Great day at the park!',
    visibility: 'public',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    authorId: 'author3',
    authorName: 'Max Owner',
    kind: 'video',
    text: 'Check out this video',
    media: ['https://example.com/video1.mp4'],
    visibility: 'public',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

describe('SavedPostsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render saved posts view with header', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue(mockPosts)

      render(<SavedPostsView />)

      await waitFor(() => {
        expect(screen.getByText('Saved Posts')).toBeInTheDocument()
      })
    })

    it('should render back button when onBack is provided', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue([])

      const onBack = vi.fn()
      render(<SavedPostsView onBack={onBack} />)

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i })
        expect(backButton).toBeInTheDocument()
      })
    })

    it('should not render back button when onBack is not provided', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue([])

      render(<SavedPostsView />)

      await waitFor(() => {
        expect(screen.getByText('Saved Posts')).toBeInTheDocument()
      })

      const backButtons = screen.queryAllByRole('button', { name: /back/i })
      expect(backButtons.length).toBe(0)
    })

    it('should display post count in header', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue(mockPosts)

      render(<SavedPostsView />)

      await waitFor(() => {
        expect(screen.getByText(/3 posts saved/i)).toBeInTheDocument()
      })
    })

    it('should display singular post count for one post', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue([mockPosts[0]])

      render(<SavedPostsView />)

      await waitFor(() => {
        expect(screen.getByText(/1 post saved/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading skeletons while loading', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      )

      render(<SavedPostsView />)

      expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0)
    })

    it('should hide loading skeletons after posts load', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue(mockPosts)

      render(<SavedPostsView />)

      await waitFor(() => {
        expect(screen.queryByTestId(/skeleton/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Post Display', () => {
    it('should display saved posts when loaded', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue(mockPosts)

      render(<SavedPostsView />)

      await waitFor(() => {
        expect(screen.getByTestId('post-card-1')).toBeInTheDocument()
        expect(screen.getByTestId('post-card-2')).toBeInTheDocument()
        expect(screen.getByTestId('post-card-3')).toBeInTheDocument()
      })
    })

    it('should render post content', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue(mockPosts)

      render(<SavedPostsView />)

      await waitFor(() => {
        expect(screen.getByText('My cute pet!')).toBeInTheDocument()
        expect(screen.getByText('Great day at the park!')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no saved posts', async () => {
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue([])

      render(<SavedPostsView />)

      await waitFor(() => {
        expect(screen.getByText('No saved posts yet')).toBeInTheDocument()
        expect(screen.getByText(/Posts you save will appear here for easy access later/i)).toBeInTheDocument()
      })
    })
  })

  describe('Post Interactions', () => {
    it('should open post detail when post is clicked', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue(mockPosts)

      render(<SavedPostsView />)

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

    it('should close post detail when close button is clicked', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      vi.mocked(communityService.getSavedPosts).mockResolvedValue(mockPosts)

      render(<SavedPostsView />)

      await waitFor(() => {
        expect(screen.getByTestId('post-card-1')).toBeInTheDocument()
      })

      const postCard = screen.getByTestId('post-card-1')
      await user.click(postCard)

      await waitFor(() => {
        expect(screen.getByTestId('post-detail-view')).toBeInTheDocument()
      })

      const closeButton = screen.getByText('Close')
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('post-detail-view')).not.toBeInTheDocument()
      })
    })

    it('should call onAuthorClick when author is clicked in post card', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      const onAuthorClick = vi.fn()
      vi.mocked(communityService.getSavedPosts).mockResolvedValue(mockPosts)

      render(<SavedPostsView onAuthorClick={onAuthorClick} />)

      await waitFor(() => {
        expect(screen.getByTestId('post-card-1')).toBeInTheDocument()
      })

      const authorButton = screen.getByTestId('post-card-1').querySelector('button')
      if (authorButton) {
        await user.click(authorButton)
      }

      await waitFor(() => {
        expect(onAuthorClick).toHaveBeenCalledWith('author1')
      })
    })

    it('should call onAuthorClick when author is clicked in post detail', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      const onAuthorClick = vi.fn()
      vi.mocked(communityService.getSavedPosts).mockResolvedValue(mockPosts)

      render(<SavedPostsView onAuthorClick={onAuthorClick} />)

      await waitFor(() => {
        expect(screen.getByTestId('post-card-1')).toBeInTheDocument()
      })

      const postCard = screen.getByTestId('post-card-1')
      await user.click(postCard)

      await waitFor(() => {
        expect(screen.getByTestId('post-detail-view')).toBeInTheDocument()
      })

      const authorButtons = screen.getByTestId('post-detail-view').querySelectorAll('button')
      const authorButton = Array.from(authorButtons).find(btn => btn.textContent === 'Author')
      if (authorButton) {
        await user.click(authorButton)
      }

      await waitFor(() => {
        expect(onAuthorClick).toHaveBeenCalledWith('author1')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle error when loading saved posts fails', async () => {
      const { communityService } = await import('@/lib/community-service')
      const { toast } = await import('sonner')
      vi.mocked(communityService.getSavedPosts).mockRejectedValue(new Error('Failed to load'))

      render(<SavedPostsView />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load saved posts')
      })
    })
  })

  describe('Back Button', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup()
      const { communityService } = await import('@/lib/community-service')
      const onBack = vi.fn()
      vi.mocked(communityService.getSavedPosts).mockResolvedValue([])

      render(<SavedPostsView onBack={onBack} />)

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i })
        expect(backButton).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      expect(onBack).toHaveBeenCalled()
    })
  })
})

