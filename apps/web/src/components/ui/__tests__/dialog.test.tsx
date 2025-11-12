/**
 * Dialog Component Tests
 * Location: apps/web/src/components/ui/__tests__/dialog.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import * as useReducedMotionHook from '@/hooks/useReducedMotion';

// Mock the useReducedMotion hook
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated') as Record<string, unknown>;
  return {
    ...actual,
    useSharedValue: vi.fn((initial: unknown) => ({ value: initial })),
    useAnimatedStyle: vi.fn((fn: () => unknown) => fn()),
    withTiming: vi.fn((value: unknown) => value),
    withSpring: vi.fn((value: unknown) => value),
    Easing: {
      linear: vi.fn(),
      inOut: vi.fn((easing: unknown) => easing),
      ease: vi.fn(),
    },
  };
});

// Mock haptics
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

describe('Dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render dialog trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('should open dialog when trigger is clicked', async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByText('Open');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    });
  });

  it('should render dialog with title and description', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });
  });

  it('should render dialog with header and footer', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Header</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <button>Cancel</button>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
  });

  it('should close dialog when close button is clicked', async () => {
    const onOpenChange = vi.fn();

    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close dialog');
    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should not render close button when showCloseButton is false', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Close dialog')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Accessible Dialog</DialogTitle>
          <DialogDescription>This is an accessible dialog</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByText('Accessible Dialog')).toBeInTheDocument();
      expect(screen.getByText('This is an accessible dialog')).toBeInTheDocument();
    });
  });

  it('should respect reduced motion preference', async () => {
    vi.mocked(useReducedMotionHook.useReducedMotion).mockReturnValue(true);

    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Reduced Motion</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await waitFor(() => {
      expect(screen.getByText('Reduced Motion')).toBeInTheDocument();
    });
  });

  it('should support haptic feedback prop', () => {
    render(
      <Dialog hapticFeedback>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});
