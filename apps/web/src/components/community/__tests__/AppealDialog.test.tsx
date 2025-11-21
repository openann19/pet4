/**
 * AppealDialog tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppealDialog } from '@/components/community/AppealDialog';

// Mock dependencies
vi.mock('@/api/community-api', () => ({
  communityAPI: {
    appealModeration: vi.fn().mockResolvedValue({}),
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

// Mock userService
vi.mock('@/lib/user-service', () => ({
  userService: {
    user: vi.fn().mockResolvedValue({ id: 'user-1', login: 'testuser', avatarUrl: null, email: null }),
  },
}));

describe('AppealDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnAppealed = vi.fn();

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <AppealDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    );

    expect(screen.getByRole('heading', { name: /appeal moderation decision/i })).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <AppealDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    );

    expect(screen.queryByText(/appeal/i)).not.toBeInTheDocument();
  });

  it('should require appeal text', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <AppealDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit appeal/i }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);

    await user.click(submitButton);
    expect(mockOnAppealed).not.toHaveBeenCalled();
  });

  it('should require minimum 50 characters', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <AppealDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    );

    const textarea = screen.getByLabelText(/appeal explanation/i);
    await user.type(textarea, 'Short text');

    const submitButton = screen.getByRole('button', { name: /submit appeal/i }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);

    await user.type(textarea, ' and adding more context to reach the length requirement.');

    expect(submitButton.disabled).toBe(false);
  });

  it('should submit appeal successfully', async () => {
    const user = userEvent.setup({ delay: null });
    const { communityAPI } = await import('@/api/community-api');
    const { toast } = await import('sonner');

    render(
      <AppealDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
        onAppealed={mockOnAppealed}
      />
    );

    const textarea = screen.getByLabelText(/appeal explanation/i);
    await user.type(
      textarea,
      'This is a detailed appeal explanation that exceeds the minimum character requirement.'
    );

    const submitButton = screen.getByRole('button', { name: /submit appeal/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(communityAPI.appealModeration).toHaveBeenCalledWith(
        'post-1',
        'post',
        'user-1',
        'testuser',
        expect.stringContaining('This is a detailed appeal'),
        undefined
      );
      expect(toast.success).toHaveBeenCalled();
      expect(mockOnAppealed).toHaveBeenCalled();
    });
  });

  it('should include reportId when provided', async () => {
    const user = userEvent.setup({ delay: null });
    const { communityAPI } = await import('@/api/community-api');

    render(
      <AppealDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
        reportId="report-1"
      />
    );

    const textarea = screen.getByLabelText(/appeal explanation/i);
    await user.type(
      textarea,
      'This is a detailed appeal explanation that exceeds the minimum character requirement.'
    );

    const submitButton = screen.getByRole('button', { name: /submit appeal/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(communityAPI.appealModeration).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        'report-1'
      );
    });
  });

  it('should close dialog on cancel', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <AppealDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
      />
    );

    const dialog = await screen.findByRole('dialog');
    const cancelButton = within(dialog).getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should display moderation reason when provided', () => {
    render(
      <AppealDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        resourceType="post"
        resourceId="post-1"
        moderationReason="Content violation"
      />
    );

    expect(screen.getByText(/content violation/i)).toBeInTheDocument();
  });
});
