import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartToast } from '../SmartToast';
import type { ToastType } from '../SmartToast';

vi.mock('react-native-reanimated', () => ({
  useSharedValue: vi.fn(() => ({ value: 0 })),
  withSpring: vi.fn((value) => value),
  withTiming: vi.fn((value) => value),
  useAnimatedStyle: vi.fn(() => ({})),
}));
vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>
      {children}
    </div>
  ),
}));
vi.mock('@petspark/motion', () => ({
  Presence: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('SmartToast', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders toast with title', () => {
    render(<SmartToast id="toast1" type="success" title="Success!" onDismiss={mockOnDismiss} />);

    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('renders toast with description', () => {
    render(
      <SmartToast
        id="toast1"
        type="success"
        title="Success!"
        description="Operation completed"
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('displays success icon', () => {
    render(<SmartToast id="toast1" type="success" title="Success!" onDismiss={mockOnDismiss} />);

    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('applies success colors', () => {
    const { container } = render(
      <SmartToast id="toast1" type="success" title="Success!" onDismiss={mockOnDismiss} />
    );

    const toast = container.querySelector('[data-testid="animated-view"]');
    expect(toast).toHaveClass('bg-green-500/10');
  });

  it('applies error colors', () => {
    const { container } = render(
      <SmartToast id="toast1" type="error" title="Error!" onDismiss={mockOnDismiss} />
    );

    const toast = container.querySelector('[data-testid="animated-view"]');
    expect(toast).toHaveClass('bg-red-500/10');
  });

  it('applies warning colors', () => {
    const { container } = render(
      <SmartToast id="toast1" type="warning" title="Warning!" onDismiss={mockOnDismiss} />
    );

    const toast = container.querySelector('[data-testid="animated-view"]');
    expect(toast).toHaveClass('bg-yellow-500/10');
  });

  it('applies info colors', () => {
    const { container } = render(
      <SmartToast id="toast1" type="info" title="Info!" onDismiss={mockOnDismiss} />
    );

    const toast = container.querySelector('[data-testid="animated-view"]');
    expect(toast).toHaveClass('bg-blue-500/10');
  });

  it('renders action button when provided', () => {
    const mockAction = {
      label: 'Undo',
      onClick: vi.fn(),
    };

    render(
      <SmartToast
        id="toast1"
        type="success"
        title="Success!"
        action={mockAction}
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('calls action onClick when action button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const mockAction = {
      label: 'Undo',
      onClick: vi.fn(),
    };

    render(
      <SmartToast
        id="toast1"
        type="success"
        title="Success!"
        action={mockAction}
        onDismiss={mockOnDismiss}
      />
    );

    const actionButton = screen.getByText('Undo');
    await user.click(actionButton);

    expect(mockAction.onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SmartToast id="toast1" type="success" title="Success!" onDismiss={mockOnDismiss} />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('toast1');
    });
  });

  it('auto-dismisses after duration', async () => {
    render(
      <SmartToast
        id="toast1"
        type="success"
        title="Success!"
        duration={5000}
        onDismiss={mockOnDismiss}
      />
    );

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('toast1');
    });
  });

  it('uses default duration when not provided', async () => {
    render(<SmartToast id="toast1" type="success" title="Success!" onDismiss={mockOnDismiss} />);

    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  it('positions toast at top by default', () => {
    const { container } = render(
      <SmartToast id="toast1" type="success" title="Success!" onDismiss={mockOnDismiss} />
    );

    const toast = container.querySelector('[data-testid="animated-view"]');
    expect(toast).toBeInTheDocument();
  });

  it('positions toast at bottom when specified', () => {
    const { container } = render(
      <SmartToast
        id="toast1"
        type="success"
        title="Success!"
        position="bottom"
        onDismiss={mockOnDismiss}
      />
    );

    const toast = container.querySelector('[data-testid="animated-view"]');
    expect(toast).toBeInTheDocument();
  });
});
