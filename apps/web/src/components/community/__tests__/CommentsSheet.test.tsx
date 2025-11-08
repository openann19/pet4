/**
 * CommentsSheet tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentsSheet } from '@/components/community/CommentsSheet';

// Mock dependencies
vi.mock('@/lib/community-service', () => ({
  communityService: {
    getComments: vi.fn().mockResolvedValue([]),
    addComment: vi.fn().mockResolvedValue({
      id: 'comment-1',
      text: 'Test comment',
      authorId: 'user-1',
      createdAt: new Date().toISOString(),
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
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
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
      },
    },
  }),
}));

describe('CommentsSheet', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
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

    expect(screen.getByText(/comments/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <CommentsSheet
        open={false}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    expect(screen.queryByText(/comments/i)).not.toBeInTheDocument();
  });

  it('should load comments when opened', async () => {
    const { communityService } = await import('@/lib/community-service');
    vi.mocked(communityService.getComments).mockResolvedValue([
      {
        id: 'comment-1',
        text: 'First comment',
        authorId: 'user-1',
        createdAt: new Date().toISOString(),
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
  });

  it('should submit comment', async () => {
    const user = userEvent.setup();
    const { communityService } = await import('@/lib/community-service');
    const { toast } = await import('sonner');

    render(
      <CommentsSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    const textarea = screen.getByPlaceholderText(/add a comment/i);
    await user.type(textarea, 'Test comment');

    const submitButton = screen.getByRole('button', { name: /post/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(communityService.addComment).toHaveBeenCalledWith('post-1', {
        text: 'Test comment',
      });
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('should handle reply to comment', async () => {
    const user = userEvent.setup();
    const { communityService } = await import('@/lib/community-service');

    const mockComments = [
      {
        id: 'comment-1',
        text: 'Parent comment',
        authorId: 'user-1',
        createdAt: new Date().toISOString(),
      },
    ];

    vi.mocked(communityService.getComments).mockResolvedValue(mockComments as any);

    render(
      <CommentsSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Parent comment')).toBeInTheDocument();
    });

    const replyButton = screen.getByRole('button', { name: /reply/i });
    await user.click(replyButton);

    const textarea = screen.getByPlaceholderText(/add a comment/i);
    await user.type(textarea, 'Reply comment');

    const submitButton = screen.getByRole('button', { name: /post/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(communityService.addComment).toHaveBeenCalledWith('post-1', {
        text: 'Reply comment',
        parentId: 'comment-1',
      });
    });
  });

  it('should show empty state when no comments', async () => {
    render(
      <CommentsSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
    });
  });

  it('should close on close button click', async () => {
    const user = userEvent.setup();
    render(
      <CommentsSheet
        open={true}
        onOpenChange={mockOnOpenChange}
        postId="post-1"
        postAuthor="author-1"
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
