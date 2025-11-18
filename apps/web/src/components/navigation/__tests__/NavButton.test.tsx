import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NavButton } from '@/components/navigation/NavButton';

// Mocks for animation hooks
const handleHoverMock = vi.fn();
const handleLeaveMock = vi.fn();

vi.mock('@/hooks/use-nav-button-animation', () => {
  return {
    useNavButtonAnimation: vi.fn(() => ({
      buttonStyle: {},
      iconStyle: {},
      indicatorStyle: {},
      handleHover: handleHoverMock,
      handleLeave: handleLeaveMock,
    })),
  };
});

const handlePressMock = vi.fn();

vi.mock('@/effects/reanimated/use-bounce-on-tap', () => {
  return {
    useBounceOnTap: vi.fn(() => ({
      animatedStyle: {},
      handlePress: handlePressMock,
    })),
  };
});

describe('NavButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onClick via bounce animation when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <NavButton
        isActive={false}
        onClick={() => void onClick()}
        icon={<span>Icon</span>}
        label="Home"
      />,
    );

    const button = screen.getByRole('button', { name: 'Home' });
    await user.click(button);

    // We expect the composed press handler to be called
    expect(handlePressMock).toHaveBeenCalledTimes(1);
  });

  it('triggers press handler on Enter key', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <NavButton
        isActive={false}
        onClick={() => void onClick()}
        icon={<span>Icon</span>}
        label="Home"
      />,
    );

    const button = screen.getByRole('button', { name: 'Home' });
    await user.keyboard('{Enter}');

    expect(handlePressMock).toHaveBeenCalled();
  });

  it('triggers press handler on Space key', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <NavButton
        isActive={false}
        onClick={() => void onClick()}
        icon={<span>Icon</span>}
        label="Home"
      />,
    );

    const button = screen.getByRole('button', { name: 'Home' });
    button.focus();
    await user.keyboard(' ');

    expect(handlePressMock).toHaveBeenCalled();
  });

  it('invokes hover handlers from animation hook', async () => {
    const user = userEvent.setup();

    render(
      <NavButton
        isActive={false}
        onClick={() => {}}
        icon={<span>Icon</span>}
        label="Home"
      />,
    );

    const button = screen.getByRole('button', { name: 'Home' });
    await user.hover(button);
    await user.unhover(button);

    expect(handleHoverMock).toHaveBeenCalled();
    expect(handleLeaveMock).toHaveBeenCalled();
  });

  it('renders active indicator when active and showIndicator is true', () => {
    const { container } = render(
      <NavButton
        isActive
        onClick={() => {}}
        icon={<span>Icon</span>}
        label="Home"
        showIndicator
      />,
    );

    const indicator = container.querySelector(
      '.w-8.h-1.bg-linear-to-r.from-primary.via-accent.to-secondary',
    );

    expect(indicator).not.toBeNull();
  });

  it('does not render active indicator when showIndicator is false', () => {
    const { container } = render(
      <NavButton
        isActive
        onClick={() => {}}
        icon={<span>Icon</span>}
        label="Home"
        showIndicator={false}
      />,
    );

    const indicator = container.querySelector(
      '.w-8.h-1.bg-linear-to-r.from-primary.via-accent.to-secondary',
    );

    expect(indicator).toBeNull();
  });
});
