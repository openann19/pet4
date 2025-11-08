import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ReactionBurstParticles } from '../ReactionBurstParticles';

// Force reduced motion path (fast onComplete)
vi.mock('@/effects/chat/core/reduced-motion', () => ({
  useReducedMotion: () => true,
  getReducedMotionDuration: (base: number) => Math.min(120, base),
}));

// Mock seeded RNG
vi.mock('@/effects/chat/core/seeded-rng', () => ({
  createSeededRNG: () => ({
    range: (min: number, max: number) => (min + max) / 2,
    rangeInt: (min: number, max: number) => Math.floor((min + max) / 2),
  }),
}));

describe('ReactionBurstParticles', () => {
  it('renders particles in reduced-motion mode', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <ReactionBurstParticles enabled count={6} onComplete={onComplete} />
    );
    const particles = container.querySelectorAll('[style*="position"]');
    expect(particles.length).toBeGreaterThan(0);
    cleanup();
  });

  it('re-renders with different seed without crashing', () => {
    const { rerender, container } = render(<ReactionBurstParticles enabled count={5} seed="a" />);
    const first = container.firstElementChild as HTMLElement;
    expect(first).toBeInTheDocument();

    rerender(<ReactionBurstParticles enabled count={7} seed="b" />);
    const second = container.firstElementChild as HTMLElement;
    expect(second).toBeInTheDocument();
    cleanup();
  });
});
