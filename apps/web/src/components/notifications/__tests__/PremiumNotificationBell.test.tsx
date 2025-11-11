import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumNotificationBell } from '../PremiumNotificationBell';
import type { PremiumNotification } from '../types';

// Mock useStorage - use a closure to allow mutation
const storageMock = {
  impl: (
    key: string,
    defaultValue: unknown
  ): [unknown, () => Promise<void>, () => Promise<void>] => {
    const setter = async () => {};
    const clear = async () => {};
    return [defaultValue, setter, clear];
  },
};

vi.mock('@/hooks/use-storage', () => ({
  useStorage: (key: string, defaultValue: unknown) => storageMock.impl(key, defaultValue),
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
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));
vi.mock('../PremiumNotificationCenter', () => ({
  PremiumNotificationCenter: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="notification-center" data-open={isOpen}>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const mockNotifications: PremiumNotification[] = [
  {
    id: '1',
    type: 'match',
    title: 'New Match',
    message: 'You have a new match!',
    timestamp: Date.now() - 1000,
    read: false,
    archived: false,
    priority: 'normal',
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message',
    message: 'You have a new message',
    timestamp: Date.now() - 2000,
    read: false,
    archived: false,
    priority: 'urgent',
  },
];

describe('PremiumNotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    storageMock.impl = (key: string, defaultValue: unknown) => {
      const setter = vi.fn(async () => {});
      const clear = vi.fn(async () => {});
      if (key === 'premium-notifications') {
        return [mockNotifications, setter, clear];
      }
      if (key === 'last-notification-check') {
        return [Date.now() - 5000, setter, clear];
      }
      return [defaultValue, setter, clear];
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render notification bell', () => {
    render(<PremiumNotificationBell />);
    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toBeInTheDocument();
  });

  it('should display unread count in aria-label', () => {
    render(<PremiumNotificationBell />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('2 unread'));
  });

  it('should display urgent count in aria-label', () => {
    render(<PremiumNotificationBell />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('1 urgent'));
  });

  it('should open notification center on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PremiumNotificationBell />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      const center = screen.getByTestId('notification-center');
      expect(center).toHaveAttribute('data-open', 'true');
    });
  });

  it('should close notification center', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PremiumNotificationBell />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('notification-center')).toHaveAttribute('data-open', 'true');
    });

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.getByTestId('notification-center')).toHaveAttribute('data-open', 'false');
    });
  });

  it('should show badge when there are unread notifications', () => {
    render(<PremiumNotificationBell />);
    const badge = screen.getByLabelText(/unread notification/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('2');
  });

  it('should show 99+ for counts over 99', () => {
    const manyNotifications: PremiumNotification[] = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      type: 'match',
      title: `Notification ${i}`,
      message: `Message ${i}`,
      timestamp: Date.now() - i * 1000,
      read: false,
      archived: false,
      priority: 'normal',
    }));

    storageMock.impl = (key: string, defaultValue: unknown) => {
      const setter = vi.fn();
      const clear = vi.fn();
      if (key === 'premium-notifications') {
        return [manyNotifications, setter, clear];
      }
      if (key === 'last-notification-check') {
        return [Date.now() - 5000, setter, clear];
      }
      return [defaultValue, setter, clear];
    };

    render(<PremiumNotificationBell />);
    const badge = screen.getByLabelText(/unread notification/i);
    expect(badge).toHaveTextContent('99+');
  });

  it('should show urgent badge variant for urgent notifications', () => {
    render(<PremiumNotificationBell />);
    const badge = screen.getByLabelText(/unread notification/i);
    expect(badge).toHaveClass('bg-destructive');
  });

  it('should show default badge variant for non-urgent notifications', () => {
    const normalNotifications: PremiumNotification[] = [
      {
        id: '1',
        type: 'match',
        title: 'New Match',
        message: 'You have a new match!',
        timestamp: Date.now() - 1000,
        read: false,
        archived: false,
        priority: 'normal',
      },
    ];

    storageMock.impl = (key: string, defaultValue: unknown) => {
      const setter = vi.fn();
      const clear = vi.fn();
      if (key === 'premium-notifications') {
        return [normalNotifications, setter, clear];
      }
      if (key === 'last-notification-check') {
        return [Date.now() - 5000, setter, clear];
      }
      return [defaultValue, setter, clear];
    };

    render(<PremiumNotificationBell />);
    const badge = screen.getByLabelText(/unread notification/i);
    expect(badge).not.toHaveClass('bg-destructive');
  });

  it('should not show badge when all notifications are read', () => {
    const readNotifications: PremiumNotification[] = [
      {
        id: '1',
        type: 'match',
        title: 'New Match',
        message: 'You have a new match!',
        timestamp: Date.now() - 1000,
        read: true,
        archived: false,
        priority: 'normal',
      },
    ];

    storageMock.impl = (key: string, defaultValue: unknown) => {
      const setter = vi.fn();
      const clear = vi.fn();
      if (key === 'premium-notifications') {
        return [readNotifications, setter, clear];
      }
      if (key === 'last-notification-check') {
        return [Date.now() - 5000, setter, clear];
      }
      return [defaultValue, setter, clear];
    };

    render(<PremiumNotificationBell />);
    const badge = screen.queryByLabelText(/unread notification/i);
    expect(badge).not.toBeInTheDocument();
  });

  it('should not show badge when all notifications are archived', () => {
    const archivedNotifications: PremiumNotification[] = [
      {
        id: '1',
        type: 'match',
        title: 'New Match',
        message: 'You have a new match!',
        timestamp: Date.now() - 1000,
        read: false,
        archived: true,
        priority: 'normal',
      },
    ];

    storageMock.impl = (key: string, defaultValue: unknown) => {
      const setter = vi.fn();
      const clear = vi.fn();
      if (key === 'premium-notifications') {
        return [archivedNotifications, setter, clear];
      }
      if (key === 'last-notification-check') {
        return [Date.now() - 5000, setter, clear];
      }
      return [defaultValue, setter, clear];
    };

    render(<PremiumNotificationBell />);
    const badge = screen.queryByLabelText(/unread notification/i);
    expect(badge).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<PremiumNotificationBell />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('should update aria-expanded when opened', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PremiumNotificationBell />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('should handle empty notifications array', () => {
    storageMock.impl = (key: string, defaultValue: unknown) => {
      const setter = vi.fn();
      const clear = vi.fn();
      if (key === 'premium-notifications') {
        return [[], setter, clear];
      }
      if (key === 'last-notification-check') {
        return [Date.now() - 5000, setter, clear];
      }
      return [defaultValue, setter, clear];
    };

    render(<PremiumNotificationBell />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Notifications');
  });

  it('should handle null notifications', () => {
    storageMock.impl = (key: string, defaultValue: unknown) => {
      const setter = vi.fn();
      const clear = vi.fn();
      if (key === 'premium-notifications') {
        return [null, setter, clear];
      }
      if (key === 'last-notification-check') {
        return [Date.now() - 5000, setter, clear];
      }
      return [defaultValue, setter, clear];
    };

    render(<PremiumNotificationBell />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should trigger haptic feedback on click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { haptics } = await import('@/lib/haptics');
    render(<PremiumNotificationBell />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(haptics.medium).toHaveBeenCalled();
  });

  it('should show bell icon when no new notifications', () => {
    storageMock.impl = (key: string, defaultValue: unknown) => {
      const setter = vi.fn();
      const clear = vi.fn();
      if (key === 'premium-notifications') {
        return [mockNotifications, setter, clear];
      }
      if (key === 'last-notification-check') {
        return [Date.now(), setter, clear];
      }
      return [defaultValue, setter, clear];
    };

    render(<PremiumNotificationBell />);
    const button = screen.getByRole('button');
    const bellIcon = button.querySelector('svg');
    expect(bellIcon).toBeInTheDocument();
  });

  it('should count critical priority as urgent', () => {
    const criticalNotifications: PremiumNotification[] = [
      {
        id: '1',
        type: 'system',
        title: 'Critical Alert',
        message: 'Critical system alert',
        timestamp: Date.now() - 1000,
        read: false,
        archived: false,
        priority: 'critical',
      },
    ];

    storageMock.impl = (key: string, defaultValue: unknown) => {
      const setter = vi.fn();
      const clear = vi.fn();
      if (key === 'premium-notifications') {
        return [criticalNotifications, setter, clear];
      }
      if (key === 'last-notification-check') {
        return [Date.now() - 5000, setter, clear];
      }
      return [defaultValue, setter, clear];
    };

    render(<PremiumNotificationBell />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('1 urgent'));
  });

  it('should handle multiple clicks', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PremiumNotificationBell />);

    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('notification-center')).toHaveAttribute('data-open', 'true');
    });
  });
});
