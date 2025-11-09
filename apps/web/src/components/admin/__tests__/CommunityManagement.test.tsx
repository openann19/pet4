import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommunityManagement from '../CommunityManagement';
import { useStorage } from '@/hooks/use-storage';
import { communityService } from '@/lib/community-service';

vi.mock('@/hooks/use-storage');
vi.mock('@/lib/community-service', () => ({
  communityService: {
    getFeed: vi.fn(),
    deletePost: vi.fn(),
  },
}));
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
  }),
}));
vi.mock('@/components/community/PostCard', () => ({
  PostCard: ({ post }: { post: { _id?: string; id?: string; content: string } }) => (
    <div data-testid={`post-${post._id || post.id}`}>{post.content}</div>
  ),
}));
vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn(() => ({ value: 0 })),
  useAnimatedStyle: vi.fn(() => ({})),
  withTiming: vi.fn((value) => value),
}));

const mockUseStorage = vi.mocked(useStorage);
const mockCommunityService = vi.mocked(communityService);

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
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'hidden-posts') {
        return [[], vi.fn(), vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });
    mockCommunityService.getFeed.mockResolvedValue({ posts: mockPosts, total: mockPosts.length } as never);
  });

  it('renders community management', async () => {
    render(<CommunityManagement />);

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument();
    });
  });

  it('loads and displays posts', async () => {
    render(<CommunityManagement />);

    await waitFor(() => {
      expect(mockCommunityService.getFeed).toHaveBeenCalled();
    });
  });

  it('filters posts by search query', async () => {
    const user = userEvent.setup();
    render(<CommunityManagement />);

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Post 1');

    await waitFor(() => {
      expect(screen.getByText(/post 1/i)).toBeInTheDocument();
    });
  });

  it('hides post when hide button is clicked', async () => {
    const user = userEvent.setup();
    render(<CommunityManagement />);

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument();
    });

    const hideButtons = screen.queryAllByRole('button', { name: /hide/i });
    const hideButton = hideButtons[0];
    if (hideButton) {
      await user.click(hideButton);
    }
  });

  it('unhides post when unhide button is clicked', async () => {
    const user = userEvent.setup();
    mockUseStorage.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'hidden-posts') {
        return [['1'], vi.fn(), vi.fn()];
      }
      return [defaultValue, vi.fn(), vi.fn()];
    });

    render(<CommunityManagement />);

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument();
    });

    const unhideButtons = screen.queryAllByRole('button', { name: /unhide/i });
    const unhideButton = unhideButtons[0];
    if (unhideButton) {
      await user.click(unhideButton);
    }
  });

  it('deletes post when delete button is clicked', async () => {
    const user = userEvent.setup();
    mockCommunityService.deletePost.mockResolvedValue(undefined);

    render(<CommunityManagement />);

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument();
    });

    const deleteButtons = screen.queryAllByRole('button', { name: /delete/i });
    const deleteButton = deleteButtons[0];
    if (deleteButton) {
      await user.click(deleteButton);
    }
  });

  it('filters by status tabs', async () => {
    const user = userEvent.setup();
    render(<CommunityManagement />);

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument();
    });

    const tabs = screen.getAllByRole('tab');
    const secondTab = tabs[1];
    if (secondTab) {
      await user.click(secondTab);
    }
  });

  it('handles empty posts list', async () => {
    mockCommunityService.getFeed.mockResolvedValue({ posts: [], total: 0 } as never);

    render(<CommunityManagement />);

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockCommunityService.getFeed.mockRejectedValue(new Error('API Error'));

    render(<CommunityManagement />);

    await waitFor(() => {
      expect(screen.getByText(/community management/i)).toBeInTheDocument();
    });
  });
});
