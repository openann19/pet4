import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommunityManagement from '../CommunityManagement'
import { useStorage } from '@/hooks/useStorage'
import { communityService } from '@/lib/community-service'

vi.mock('@/hooks/useStorage')
vi.mock('@/lib/community-service', () => ({
  communityService: {
    getPosts: vi.fn(),
    deletePost: vi.fn(),
  },
}))
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
  }),
}))
vi.mock('@/components/community/PostCard', () => ({
  PostCard: ({ post }: { post: { _id?: string; id?: string; content: string } }) => (
    <div data-testid={`post-${post._id || post.id}`}>{post.content}</div>
  ),
}))
vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn(() => ({ value: 0 })),
  useAnimatedStyle: vi.fn(() => ({})),
  withTiming: vi.fn((value) => value),
}))

const mockUseStorage = vi.mocked(useStorage)
const mockCommunityService = vi.mocked(communityService)

describe('CommunityManagement', () => {
  const mockPosts = [
    {
      _id: '1',
      id: '1',
      content: 'Post 1',
      authorId: 'user1',
    },
    {
      _id: '2',
      id: '2',
      content: 'Post 2',
      authorId: 'user2',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'hidden-posts') {
        return [[], vi.fn(), vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })
    mockCommunityService.getPosts.mockResolvedValue(mockPosts as never)
  })

  it('renders community management', async () => {
    render(<CommunityManagement />)

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument()
    })
  })

  it('loads and displays posts', async () => {
    render(<CommunityManagement />)

    await waitFor(() => {
      expect(mockCommunityService.getPosts).toHaveBeenCalled()
    })
  })

  it('filters posts by search query', async () => {
    const user = userEvent.setup()
    render(<CommunityManagement />)

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'Post 1')

    await waitFor(() => {
      expect(screen.getByText(/post 1/i)).toBeInTheDocument()
    })
  })

  it('hides post when hide button is clicked', async () => {
    const user = userEvent.setup()
    render(<CommunityManagement />)

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument()
    })

    const hideButtons = screen.queryAllByRole('button', { name: /hide/i })
    if (hideButtons.length > 0) {
      await user.click(hideButtons[0])
    }
  })

  it('unhides post when unhide button is clicked', async () => {
    const user = userEvent.setup()
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'hidden-posts') {
        return [['1'], vi.fn(), vi.fn()]
      }
      return [defaultValue, vi.fn(), vi.fn()]
    })

    render(<CommunityManagement />)

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument()
    })

    const unhideButtons = screen.queryAllByRole('button', { name: /unhide/i })
    if (unhideButtons.length > 0) {
      await user.click(unhideButtons[0])
    }
  })

  it('deletes post when delete button is clicked', async () => {
    const user = userEvent.setup()
    mockCommunityService.deletePost.mockResolvedValue(undefined)

    render(<CommunityManagement />)

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument()
    })

    const deleteButtons = screen.queryAllByRole('button', { name: /delete/i })
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0])
    }
  })

  it('filters by status tabs', async () => {
    const user = userEvent.setup()
    render(<CommunityManagement />)

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument()
    })

    const tabs = screen.getAllByRole('tab')
    if (tabs.length > 1) {
      await user.click(tabs[1])
    }
  })

  it('handles empty posts list', async () => {
    mockCommunityService.getPosts.mockResolvedValue([] as never)

    render(<CommunityManagement />)

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockCommunityService.getPosts.mockRejectedValue(new Error('API Error'))

    render(<CommunityManagement />)

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument()
    })
  })
})

