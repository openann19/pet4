/**
 * RankingSkeleton tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RankingSkeleton } from '@/components/community/RankingSkeleton';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: () => false,
}));

describe('RankingSkeleton', () => {
  it('should render post skeleton by default', () => {
    render(<RankingSkeleton />);
    expect(screen.getByRole('status', { name: /loading posts/i })).toBeInTheDocument();
  });

  it('should render specified count of skeletons', () => {
    const { container } = render(<RankingSkeleton count={5} />);
    const skeletons = container.querySelectorAll('[role="status"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render comment variant', () => {
    render(<RankingSkeleton variant="comment" />);
    expect(screen.getByRole('status', { name: /loading comments/i })).toBeInTheDocument();
  });

  it('should render user variant', () => {
    render(<RankingSkeleton variant="user" />);
    expect(screen.getByRole('status', { name: /loading users/i })).toBeInTheDocument();
  });

  it('should have accessible loading text', () => {
    render(<RankingSkeleton variant="post" />);
    expect(screen.getByText(/loading feed content/i)).toBeInTheDocument();
  });
});
