import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageReactions from '../MessageReactions';
import type { MessageReaction } from '@/lib/chat-types';

const mockReactions: MessageReaction[] = [
  {
    emoji: '❤️',
    userId: 'user1',
    userName: 'Alice',
    userAvatar: 'https://example.com/alice.jpg',
  },
  {
    emoji: '❤️',
    userId: 'user2',
    userName: 'Bob',
    userAvatar: 'https://example.com/bob.jpg',
  },
  {
    emoji: '🔥',
    userId: 'user1',
    userName: 'Alice',
    userAvatar: 'https://example.com/alice.jpg',
  },
];

const mockAvailableReactions = ['❤️', '😂', '👍', '👎', '🔥', '🙏', '⭐'] as const;

describe('MessageReactions', () => {
  const defaultProps = {
    reactions: mockReactions,
    availableReactions: mockAvailableReactions,
    onReact: vi.fn(),
    currentUserId: 'user1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reaction buttons for each unique emoji', () => {
    render(<MessageReactions {...defaultProps} />);

    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('displays reaction counts correctly', () => {
    render(<MessageReactions {...defaultProps} />);

    const heartReaction = screen.getByText('❤️').closest('button');
    expect(heartReaction).toHaveTextContent('2');

    const fireReaction = screen.getByText('🔥').closest('button');
    expect(fireReaction).toHaveTextContent('1');
  });

  it('highlights reactions from current user', () => {
    render(<MessageReactions {...defaultProps} />);

    const heartReaction = screen.getByText('❤️').closest('button');
    expect(heartReaction).toHaveClass('bg-primary/20', 'ring-1', 'ring-primary');

    const fireReaction = screen.getByText('🔥').closest('button');
    expect(fireReaction).toHaveClass('bg-primary/20', 'ring-1', 'ring-primary');
  });

  it('does not highlight reactions not from current user', () => {
    render(<MessageReactions {...defaultProps} currentUserId="user3" />);

    const heartReaction = screen.getByText('❤️').closest('button');
    expect(heartReaction).toHaveClass('bg-white/10');
    expect(heartReaction).not.toHaveClass('bg-primary/20');
  });

  it('calls onReact when reaction button is clicked', async () => {
    const onReact = vi.fn();
    const user = userEvent.setup();

    render(<MessageReactions {...defaultProps} onReact={onReact} />);

    const heartButton = screen.getByText('❤️').closest('button');
    if (heartButton) {
      await user.click(heartButton);
    }

    await waitFor(() => {
      expect(onReact).toHaveBeenCalledWith('❤️');
    });
  });

  it('shows add reaction button', () => {
    render(<MessageReactions {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: /\+/i });
    expect(addButton).toBeInTheDocument();
  });

  it('opens reaction picker when add button is clicked', async () => {
    const user = userEvent.setup();

    render(<MessageReactions {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: /\+/i });
    await user.click(addButton);

    await waitFor(() => {
      mockAvailableReactions.forEach((emoji) => {
        expect(screen.getByText(emoji)).toBeInTheDocument();
      });
    });
  });

  it('calls onReact when emoji is selected from picker', async () => {
    const onReact = vi.fn();
    const user = userEvent.setup();

    render(<MessageReactions {...defaultProps} onReact={onReact} />);

    const addButton = screen.getByRole('button', { name: /\+/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('😂')).toBeInTheDocument();
    });

    const emojiButton = screen.getByText('😂');
    await user.click(emojiButton);

    await waitFor(() => {
      expect(onReact).toHaveBeenCalledWith('😂');
    });
  });

  it('closes picker after selecting emoji', async () => {
    const user = userEvent.setup();

    render(<MessageReactions {...defaultProps} />);

    const addButton = screen.getByRole('button', { name: /\+/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('😂')).toBeInTheDocument();
    });

    const emojiButton = screen.getByText('😂');
    await user.click(emojiButton);

    await waitFor(
      () => {
        expect(screen.queryByText('😂')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('shows user list in popover when reaction is clicked', async () => {
    const user = userEvent.setup();

    render(<MessageReactions {...defaultProps} />);

    const heartButton = screen.getByText('❤️').closest('button');
    if (heartButton) {
      await user.click(heartButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('handles empty reactions array', () => {
    render(<MessageReactions {...defaultProps} reactions={[]} />);

    expect(screen.queryByText('❤️')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+/i })).toBeInTheDocument();
  });

  it('handles reactions with missing user data', () => {
    const reactionsWithMissingData: MessageReaction[] = [
      {
        emoji: '❤️',
        userId: undefined,
        userName: undefined,
        userAvatar: undefined,
      },
    ];

    render(<MessageReactions {...defaultProps} reactions={reactionsWithMissingData} />);

    const heartButton = screen.getByText('❤️').closest('button');
    expect(heartButton).toBeInTheDocument();
  });

  it('groups reactions by emoji correctly', () => {
    const multipleReactions: MessageReaction[] = [
      { emoji: '❤️', userId: 'user1', userName: 'User1' },
      { emoji: '❤️', userId: 'user2', userName: 'User2' },
      { emoji: '❤️', userId: 'user3', userName: 'User3' },
      { emoji: '🔥', userId: 'user1', userName: 'User1' },
    ];

    render(<MessageReactions {...defaultProps} reactions={multipleReactions} />);

    const heartButtons = screen.getAllByText('❤️');
    expect(heartButtons.length).toBeGreaterThan(0);

    const heartButton = heartButtons[0]?.closest('button');
    if (heartButton) {
      expect(heartButton).toHaveTextContent('3');
    }

    const fireButton = screen.getByText('🔥').closest('button');
    if (fireButton) {
      expect(fireButton).toHaveTextContent('1');
    }
  });

  it('handles reactions with empty emoji', () => {
    const reactionsWithEmptyEmoji: MessageReaction[] = [
      { emoji: '', userId: 'user1', userName: 'User1' },
      { emoji: '❤️', userId: 'user2', userName: 'User2' },
    ];

    render(<MessageReactions {...defaultProps} reactions={reactionsWithEmptyEmoji} />);

    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.queryByText('')).not.toBeInTheDocument();
  });
});
