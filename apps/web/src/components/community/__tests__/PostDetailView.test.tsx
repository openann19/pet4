/**
 * PostDetailView tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PostDetailView } from '@/components/community/PostDetailView'

// Mock dependencies
vi.mock('@/api/community-api', () => ({
  communityAPI: {
    getPost: vi.fn().mockResolvedValue({
      id: 'post-1',
      authorId: 'user-1',
      authorName: 'Test User',
      text: 'Test post',
      createdAt: new Date().toISOString(),
    }),
    toggleReaction: vi.fn().mockResolvedValue({ added: true, reactionsCount: 1 }),
    createComment: vi.fn().mockResolvedValue({ id: 'comment-1' }),
  },
}))

vi.mock('@/lib/community-service', () => ({
  communityService: {
    getComments: vi.fn().mockResolvedValue([]),
    savePost: vi.fn().mockResolvedValue({}),
    unsavePost: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/lib/user-service', () => ({
  userService: {
    user: vi.fn().mockResolvedValue({ id: 'user-1', name: 'Test User', avatarUrl: 'https://example.com/avatar.jpg' }),
  },
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/components/community/MediaViewer', () => ({
  MediaViewer: () => <div data-testid="media-viewer">Media</div>,
}))

vi.mock('@/components/community/ReportDialog', () => ({
  ReportDialog: () => <div data-testid="report-dialog">Report</div>,
}))

vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    t: {
      community: {
        saved: 'Saved',
        unsaved: 'Unsaved',
      },
    },
  }),
}))

describe('PostDetailView', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnAuthorClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when open', async () => {
    render(
      <PostDetailView
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        onAuthorClick={mockOnAuthorClick}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test post')).toBeInTheDocument()
    })
  })

  it('should not render when closed', () => {
    render(
      <PostDetailView
        open={false}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        onAuthorClick={mockOnAuthorClick}
      />
    )

    expect(screen.queryByText('Test post')).not.toBeInTheDocument()
  })

  it('should load post data', async () => {
    const { communityAPI } = await import('@/api/community-api')

    render(
      <PostDetailView
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        onAuthorClick={mockOnAuthorClick}
      />
    )

    await waitFor(() => {
      expect(communityAPI.getPost).toHaveBeenCalledWith('post-1')
    })
  })

  it('should display post content', async () => {
    render(
      <PostDetailView
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        onAuthorClick={mockOnAuthorClick}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test post')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  it('should render comment input', async () => {
    render(
      <PostDetailView
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        onAuthorClick={mockOnAuthorClick}
      />
    )

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/add a comment/i)).toBeInTheDocument()
    })
  })

  it('should handle close', async () => {
    render(
      <PostDetailView
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        onAuthorClick={mockOnAuthorClick}
      />
    )

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })
  })
})

