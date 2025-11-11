/**
 * PostCard tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostCard } from '@/components/community/PostCard';
import type { Post } from '@/lib/community-types';

// Mock dependencies
vi.mock('@/api/community-api', () => ({
  communityAPI: {
    toggleReaction: vi.fn().mockResolvedValue({ added: true, reactionsCount: 1 }),
  },
}));

vi.mock('@/lib/community-service', () => ({
  communityService: {
    savePost: vi.fn().mockResolvedValue({}),
    unsavePost: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(() => undefined),
    trigger: vi.fn(() => undefined),
    light: vi.fn(() => undefined),
    medium: vi.fn(() => undefined),
    heavy: vi.fn(() => undefined),
    selection: vi.fn(() => undefined),
    success: vi.fn(() => undefined),
    warning: vi.fn(() => undefined),
    error: vi.fn(() => undefined),
    notification: vi.fn(() => undefined),
    isHapticSupported: vi.fn(() => false),
  },
  triggerHaptic: vi.fn(() => undefined),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn(() => ({ value: 0 })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v) => v),
  withTiming: vi.fn((v) => v),
  withSequence: vi.fn((v) => v),
}));

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  useAnimatedStyleValue: vi.fn((style: unknown) => {
    if (typeof style === 'function') {
      try {
        return style();
      } catch {
        return {};
      }
    }
    return style || {};
  }),
}));

vi.mock('@/effects/reanimated', () => ({
  useHoverTap: vi.fn(() => ({ scale: { value: 1 } })),
}));

vi.mock('@/effects/reanimated/transitions', () => ({
  springConfigs: { smooth: {}, bouncy: {} },
  timingConfigs: { fast: {} },
}));

vi.mock('@/components/community/CommentsSheet', () => ({
  CommentsSheet: () => <div data-testid="comments-sheet">Comments</div>,
}));

vi.mock('@/components/community/MediaViewer', () => ({
  MediaViewer: () => <div data-testid="media-viewer">Media</div>,
}));

vi.mock('@/components/community/PostDetailView', () => ({
  PostDetailView: () => <div data-testid="post-detail">Detail</div>,
}));

vi.mock('@/components/community/ReportDialog', () => ({
  ReportDialog: () => <div data-testid="report-dialog">Report</div>,
}));

// Mock spark
global.window = {
  ...global.window,
  spark: {
    user: vi.fn().mockResolvedValue({
      id: 'user-1',
      login: 'testuser',
      avatarUrl: 'https://example.com/avatar.jpg',
    }),
  },
} as any;

describe('PostCard', () => {
  const mockPost: Post = {
    id: 'post-1',
    authorId: 'user-1',
    authorName: 'Test User',
    kind: 'text',
    text: 'Test post content',
    visibility: 'public',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOnAuthorClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render post card', () => {
    render(<PostCard post={mockPost} onAuthorClick={mockOnAuthorClick} />);

    expect(screen.getByText('Test post content')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should display post text', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test post content')).toBeInTheDocument();
  });

  it('should display author name', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(<PostCard post={mockPost} />);

    expect(screen.getByRole('button', { name: /like/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /comment/i })).toBeInTheDocument();
  });

  it('should handle empty post text', () => {
    const postWithoutText: Post = {
      ...mockPost,
      text: undefined,
    };

    render(<PostCard post={postWithoutText} />);

    // Should still render the card
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
