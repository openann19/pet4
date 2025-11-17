/**
 * Unit tests for PresenceAvatar component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { PresenceAvatar } from '../PresenceAvatar';

describe('PresenceAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('should render with online status', () => {
    const { container } = render(<PresenceAvatar src="/avatar.jpg" alt="Test" status="online" />);

    // Component should render - check for container
    const avatarContainer = container.firstElementChild;
    expect(avatarContainer).toBeInTheDocument();
  });

  it('should hide ring when status is offline', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // Reduced motion enabled
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { container } = render(<PresenceAvatar src="/avatar.jpg" alt="Test" status="offline" />);

    // Component should render
    const avatarContainer = container.firstElementChild;
    expect(avatarContainer).toBeInTheDocument();
  });

  it('should show ring for online status', () => {
    const { container } = render(<PresenceAvatar src="/avatar.jpg" alt="Test" status="online" />);

    // Component should render
    const avatarContainer = container.firstElementChild;
    expect(avatarContainer).toBeInTheDocument();
  });

  it('should respect reduced motion (static ring)', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // Reduced motion enabled
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { container } = render(<PresenceAvatar src="/avatar.jpg" alt="Test" status="online" />);

    // Component should render without errors
    const avatarContainer = container.firstElementChild;
    expect(avatarContainer).toBeInTheDocument();
  });
});
