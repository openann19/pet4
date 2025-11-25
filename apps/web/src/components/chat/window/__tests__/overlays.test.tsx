import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Overlays } from '../Overlays';
import { UIProvider } from '@/contexts/UIContext';

// Mock the burst components
const mockConfettiBurst = ({
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
  );

vi.mock('../../ConfettiBurst', () => ({
  __esModule: true,
  ConfettiBurst: mockConfettiBurst,
  default: mockConfettiBurst,
}));

const mockReactionBurst = ({
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
  );

vi.mock('../../ReactionBurstParticles', () => ({
  __esModule: true,
  ReactionBurstParticles: mockReactionBurst,
  default: mockReactionBurst,
}));

const renderWithUI = (ui: React.ReactElement) => {
  const utils = render(<UIProvider>{ui}</UIProvider>);
  return {
    ...utils,
    rerender: (next: React.ReactElement) => utils.rerender(<UIProvider>{next}</UIProvider>),
  };
};

describe('Overlays', () => {
  it('renders nothing when seeds are zero', () => {
    const { container } = renderWithUI(
      <Overlays burstSeed={0} confettiSeed={0} roomId="room-1" />
    );
    expect(container.querySelector('[data-testid="reaction-burst"]')).toBeNull();
    expect(container.querySelector('[data-testid="confetti-burst"]')).toBeNull();
  });

  it('renders ReactionBurstParticles when burstSeed > 0', async () => {
    renderWithUI(<Overlays burstSeed={1} confettiSeed={0} roomId="room-1" />);
    const burst = await screen.findByTestId('reaction-burst');
    expect(burst).toBeInTheDocument();
    expect(burst).toHaveAttribute('data-seed', 'reaction-room-1-1');
    expect(burst).toHaveAttribute('data-enabled', 'true');
    expect(burst).toHaveClass('pointer-events-none', 'fixed', 'inset-0', 'z-50');
  });

  it('renders ConfettiBurst when confettiSeed > 0', async () => {
    renderWithUI(<Overlays burstSeed={0} confettiSeed={2} roomId="room-1" />);
    const confetti = await screen.findByTestId('confetti-burst');
    expect(confetti).toBeInTheDocument();
    expect(confetti).toHaveAttribute('data-seed', 'confetti-room-1-2');
    expect(confetti).toHaveAttribute('data-enabled', 'true');
    expect(confetti).toHaveClass('pointer-events-none', 'fixed', 'inset-0', 'z-50');
  });

  it('renders both overlays when both seeds > 0', async () => {
    renderWithUI(<Overlays burstSeed={3} confettiSeed={5} roomId="room-2" />);
    const reaction = await screen.findByTestId('reaction-burst');
    const confetti = await screen.findByTestId('confetti-burst');
    expect(reaction).toBeInTheDocument();
    expect(confetti).toBeInTheDocument();
    expect(reaction).toHaveAttribute('data-seed', 'reaction-room-2-3');
    expect(confetti).toHaveAttribute('data-seed', 'confetti-room-2-5');
  });

  it('uses correct key for restart when seed changes', async () => {
    const { rerender } = renderWithUI(<Overlays burstSeed={1} confettiSeed={1} roomId="room-1" />);
    const initialBurst = await screen.findByTestId('reaction-burst');
    expect(initialBurst).toHaveAttribute('data-seed', 'reaction-room-1-1');

    rerender(<Overlays burstSeed={2} confettiSeed={1} roomId="room-1" />);
    const newBurst = await screen.findByTestId('reaction-burst');
    // Component should remount with new seed
    expect(newBurst).toHaveAttribute('data-seed', 'reaction-room-1-2');
  });
});
