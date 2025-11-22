import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Overlays } from '../Overlays';

// Mock the UI config hook so it doesn't call useUIContext inside tests
vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: () => ({
    chatOverlays: {
      enabled: true,
      enableReactions: true,
      enableConfetti: true,
    },
  }),
}));

// Mock the burst components
vi.mock('../ConfettiBurst', () => ({
  ConfettiBurst: ({
    seed,
    enabled,
    className,
  }: {
    seed: string;
    enabled: boolean;
    className: string;
  }) => (
    <div data-testid="confetti-burst" data-seed={seed} data-enabled={enabled} className={className}>
      ConfettiBurst
    </div>
  ),
}));

vi.mock('../ReactionBurstParticles', () => ({
  ReactionBurstParticles: ({
    seed,
    enabled,
    className,
  }: {
    seed: string;
    enabled: boolean;
    className: string;
  }) => (
    <div data-testid="reaction-burst" data-seed={seed} data-enabled={enabled} className={className}>
      ReactionBurst
    </div>
  ),
}));

describe('Overlays', () => {
  it('renders nothing when seeds are zero', () => {
    const { container } = render(<Overlays burstSeed={0} confettiSeed={0} roomId="room-1" />);
    expect(container.querySelector('[data-testid="reaction-burst"]')).toBeNull();
    expect(container.querySelector('[data-testid="confetti-burst"]')).toBeNull();
  });

  it('renders ReactionBurstParticles when burstSeed > 0', () => {
    render(<Overlays burstSeed={1} confettiSeed={0} roomId="room-1" />);
    const burst = screen.getByTestId('reaction-burst');
    expect(burst).toBeInTheDocument();
    expect(burst).toHaveAttribute('data-seed', 'reaction-room-1-1');
    expect(burst).toHaveAttribute('data-enabled', 'true');
    expect(burst).toHaveClass('pointer-events-none', 'fixed', 'inset-0', 'z-50');
  });

  it('renders ConfettiBurst when confettiSeed > 0', () => {
    render(<Overlays burstSeed={0} confettiSeed={2} roomId="room-1" />);
    const confetti = screen.getByTestId('confetti-burst');
    expect(confetti).toBeInTheDocument();
    expect(confetti).toHaveAttribute('data-seed', 'confetti-room-1-2');
    expect(confetti).toHaveAttribute('data-enabled', 'true');
    expect(confetti).toHaveClass('pointer-events-none', 'fixed', 'inset-0', 'z-50');
  });

  it('renders both overlays when both seeds > 0', () => {
    render(<Overlays burstSeed={3} confettiSeed={5} roomId="room-2" />);
    expect(screen.getByTestId('reaction-burst')).toBeInTheDocument();
    expect(screen.getByTestId('confetti-burst')).toBeInTheDocument();
    expect(screen.getByTestId('reaction-burst')).toHaveAttribute('data-seed', 'reaction-room-2-3');
    expect(screen.getByTestId('confetti-burst')).toHaveAttribute('data-seed', 'confetti-room-2-5');
  });

  it('uses correct key for restart when seed changes', () => {
    const { rerender } = render(<Overlays burstSeed={1} confettiSeed={1} roomId="room-1" />);
    const initialBurst = screen.getByTestId('reaction-burst');
    expect(initialBurst).toHaveAttribute('data-seed', 'reaction-room-1-1');

    rerender(<Overlays burstSeed={2} confettiSeed={1} roomId="room-1" />);
    const newBurst = screen.getByTestId('reaction-burst');
    // Component should remount with new seed
    expect(newBurst).toHaveAttribute('data-seed', 'reaction-room-1-2');
  });
});
