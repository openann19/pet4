/**
 * CommentsSheet tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentsSheet } from '@/components/community/CommentsSheet';
import type { Comment } from '@/lib/community-types';

// Mock dependencies
vi.mock('@/lib/community-service', () => ({
  communityService: {
    getComments: vi.fn().mockResolvedValue([]),
    addComment: vi.fn().mockResolvedValue({
      id: 'comment-1',
      postId: 'post-1',
      text: 'Test comment',
      authorId: 'user-1',
      authorName: 'Test User',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactionsCount: 0,
    }),
  },
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    selection: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
}));

vi.mock('@/contexts/AppContext', () => ({
  useApp: () => ({
    t: {
      community: {
        comments: 'Comments',
        noComments: 'No comments yet',
        beFirst: 'Be the first to share your thoughts!',
        commentPosted: 'Comment posted!',
        commentError: 'Failed to post comment',
        commentsLoadError: 'Failed to load comments',
        commentPlaceholder: 'Write a comment',
        replyPlaceholder: 'Write a reply',
      },
      common: {
        close: 'Close comments',
      },
    },
  }),
}));

describe('CommentsSheet', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <CommentsSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    expect(await screen.findByRole('heading', { name: /comments/i })).toBeInTheDocument();
  });

  it('should not render when closed', async () => {
    render(
      <CommentsSheet
        open={false}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    expect(screen.queryByRole('heading', { name: /comments/i })).not.toBeInTheDocument();
  });

  it('should load comments when opened', async () => {
    const { communityService } = await import('@/lib/community-service');
    vi.mocked(communityService.getComments).mockResolvedValue([
      {
        id: 'comment-1',
        postId: 'post-1',
        text: 'First comment',
        authorId: 'user-1',
        authorName: 'Test User',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reactionsCount: 0,
      },
    ]);

    render(
      <CommentsSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    await waitFor(() => {
      expect(communityService.getComments).toHaveBeenCalledWith('post-1');
    });

    expect(await screen.findByText('First comment')).toBeInTheDocument();
  });

  it('should submit comment', async () => {
    const user = userEvent.setup({ delay: null });
    const { communityService } = await import('@/lib/community-service');
    const { toast } = await import('sonner');

    vi.mocked(communityService.getComments).mockResolvedValue([]);

    render(
      <CommentsSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    const textarea = await screen.findByPlaceholderText(/write a comment/i);
    await user.type(textarea, 'Test comment');

    const submitButton = await screen.findByRole('button', { name: /send comment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(communityService.addComment).toHaveBeenCalledWith('post-1', {
        text: 'Test comment',
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('should handle reply to comment', async () => {
    const user = userEvent.setup({ delay: null });
    const { communityService } = await import('@/lib/community-service');

    const mockComments: Comment[] = [
      {
        id: 'comment-1',
        postId: 'post-1',
        text: 'Parent comment',
        authorId: 'user-1',
        authorName: 'Test User',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reactionsCount: 0,
      },
    ];

    vi.mocked(communityService.getComments).mockResolvedValue(mockComments);

    render(
      <CommentsSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    expect(await screen.findByText('Parent comment')).toBeInTheDocument();

    const replyButton = await screen.findByRole('button', { name: /reply/i });
    await user.click(replyButton);

    const textarea = await screen.findByPlaceholderText(/write a reply/i);
    await user.type(textarea, 'Reply comment');

    const submitButton = await screen.findByRole('button', { name: /send comment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(communityService.addComment).toHaveBeenCalledWith('post-1', {
        text: 'Reply comment',
        parentId: 'comment-1',
      });
    });
  });

  it('should show empty state when no comments', async () => {
    const { communityService } = await import('@/lib/community-service');

    vi.mocked(communityService.getComments).mockResolvedValue([]);

    render(
      <CommentsSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    expect(await screen.findByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('should close on close button click', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <CommentsSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    const closeButton = await screen.findByRole('button', { name: /close comments/i });
    await user.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
