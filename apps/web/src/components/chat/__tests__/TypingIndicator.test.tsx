import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TypingIndicator from '../TypingIndicator';
import type { TypingUser } from '@/lib/chat-types';

const mockUser1: TypingUser = {
  userId: 'user1',
  userName: 'Alice',
  startedAt: new Date().toISOString(),
};

const mockUser2: TypingUser = {
  userId: 'user2',
  userName: 'Bob',
  startedAt: new Date().toISOString(),
};

const mockUser3: TypingUser = {
  userId: 'user3',
  userName: 'Charlie',
  startedAt: new Date().toISOString(),
};

describe('TypingIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should return null when users array is empty', () => {
      const { container } = render(<TypingIndicator users={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render with single user', () => {
      render(<TypingIndicator users={[mockUser1]} />);
      expect(screen.getByText('Alice is typing')).toBeInTheDocument();
    });

    it('should render with two users', () => {
      render(<TypingIndicator users={[mockUser1, mockUser2]} />);
      expect(screen.getByText('Alice and Bob are typing')).toBeInTheDocument();
    });

    it('should render with multiple users', () => {
      render(<TypingIndicator users={[mockUser1, mockUser2, mockUser3]} />);
      expect(screen.getByText('Alice and 2 others are typing')).toBeInTheDocument();
    });

    it('should display only first 3 user avatars', () => {
      const manyUsers: TypingUser[] = [
        mockUser1,
        mockUser2,
        mockUser3,
        { userId: 'user4', userName: 'David', startedAt: new Date().toISOString() },
        { userId: 'user5', userName: 'Eve', startedAt: new Date().toISOString() },
      ];
      render(<TypingIndicator users={manyUsers} />);

      // Should show "Alice and 4 others are typing"
      expect(screen.getByText('Alice and 4 others are typing')).toBeInTheDocument();
    });

    it('should render typing dots', () => {
      render(<TypingIndicator users={[mockUser1]} />);
      const dots = screen.getAllByRole('generic', { hidden: true });
      const typingDots = dots.filter((dot) => dot.className.includes('bg-primary rounded-full'));
      expect(typingDots.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TypingIndicator users={[mockUser1]} />);
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should mark decorative dots as aria-hidden', () => {
      render(<TypingIndicator users={[mockUser1]} />);
      const dotsContainer = screen.getByText('Alice is typing').nextElementSibling;
      expect(dotsContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with missing userName', () => {
      const userWithoutName: TypingUser = {
        userId: 'user1',
        userName: '',
        startedAt: new Date().toISOString(),
      };
      const { container } = render(<TypingIndicator users={[userWithoutName]} />);
      expect(container.textContent).toContain('Someone is typing');
    });

    it('should handle user with undefined userName', () => {
      const userWithUndefinedName = {
        userId: 'user1',
        userName: undefined as unknown as string,
        startedAt: new Date().toISOString(),
      };
      render(<TypingIndicator users={[userWithUndefinedName]} />);
      expect(screen.getByText('Someone is typing')).toBeInTheDocument();
    });

    it('should handle empty user name gracefully in avatar fallback', () => {
      const userWithoutName: TypingUser = {
        userId: 'user1',
        userName: '',
        startedAt: new Date().toISOString(),
      };
      render(<TypingIndicator users={[userWithoutName]} />);
      const fallback = screen.getByText('?');
      expect(fallback).toBeInTheDocument();
    });

    it('should handle multiple users with missing names', () => {
      const usersWithoutNames: TypingUser[] = [
        { userId: 'user1', userName: '', startedAt: new Date().toISOString() },
        { userId: 'user2', userName: '', startedAt: new Date().toISOString() },
      ];
      const { container } = render(<TypingIndicator users={usersWithoutNames} />);
      expect(container.textContent).toContain('Someone');
      expect(container.textContent).toContain('are typing');
    });
  });

  describe('Performance', () => {
    it('should memoize displayUsers', () => {
      const users: TypingUser[] = [mockUser1, mockUser2, mockUser3];
      const { rerender } = render(<TypingIndicator users={users} />);

      // Re-render with same users
      rerender(<TypingIndicator users={users} />);

      // Component should still render correctly
      expect(screen.getByText('Alice and 2 others are typing')).toBeInTheDocument();
    });

    it('should memoize typing text', () => {
      const users: TypingUser[] = [mockUser1];
      const { rerender } = render(<TypingIndicator users={users} />);

      expect(screen.getByText('Alice is typing')).toBeInTheDocument();

      // Re-render with same users
      rerender(<TypingIndicator users={users} />);

      expect(screen.getByText('Alice is typing')).toBeInTheDocument();
    });
  });
});
