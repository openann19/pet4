import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncomingCallNotification from '../IncomingCallNotification';
import type { Call } from '@/lib/call-types';

vi.mock('@/lib/haptics', () => ({
  haptics: {
    success: vi.fn(),
    heavy: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

const createMockCall = (overrides?: Partial<Call>): Call => {
  return {
    id: 'call1',
    roomId: 'room1',
    type: 'video',
    initiatorId: 'user1',
    recipientId: 'user2',
    status: 'ringing',
    startTime: new Date().toISOString(),
    duration: 0,
    quality: 'excellent',
    ...overrides,
  };
};

describe('IncomingCallNotification', () => {
  const mockOnAccept = vi.fn();
  const mockOnDecline = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render incoming call notification', () => {
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        callerAvatar="https://example.com/alice.jpg"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('should display caller name', () => {
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Bob"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should display video call label for video calls', () => {
    const call = createMockCall({ type: 'video' });
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('Incoming video call...')).toBeInTheDocument();
  });

  it('should display voice call label for voice calls', () => {
    const call = createMockCall({ type: 'voice' });
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('Incoming call...')).toBeInTheDocument();
  });

  it('should display caller avatar when provided', () => {
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        callerAvatar="https://example.com/alice.jpg"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const avatar = screen.getByAltText('Alice');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/alice.jpg');
  });

  it('should display fallback avatar when avatar not provided', () => {
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should handle accept button click', async () => {
    const user = userEvent.setup();
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const acceptButton = screen.getByLabelText('Accept call');
    await user.click(acceptButton);

    expect(mockOnAccept).toHaveBeenCalledTimes(1);
  });

  it('should handle decline button click', async () => {
    const user = userEvent.setup();
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const declineButton = screen.getByLabelText('Decline call');
    await user.click(declineButton);

    expect(mockOnDecline).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'incoming-call-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'incoming-call-description');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should have accessible title and description', () => {
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const title = document.getElementById('incoming-call-title');
    const description = document.getElementById('incoming-call-description');

    expect(title).toHaveTextContent('Alice');
    expect(description).toBeInTheDocument();
  });

  it('should have call actions group', () => {
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByRole('group', { name: 'Call actions' })).toBeInTheDocument();
  });

  it('should handle empty caller name gracefully', () => {
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName=""
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const fallback = screen.getByText('?');
    expect(fallback).toBeInTheDocument();
  });

  it('should handle accept error gracefully', async () => {
    const user = userEvent.setup();
    const call = createMockCall();
    const errorOnAccept = vi.fn(() => {
      throw new Error('Accept failed');
    });

    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={errorOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const acceptButton = screen.getByLabelText('Accept call');
    await user.click(acceptButton);

    expect(errorOnAccept).toHaveBeenCalled();
  });

  it('should handle decline error gracefully', async () => {
    const user = userEvent.setup();
    const call = createMockCall();
    const errorOnDecline = vi.fn(() => {
      throw new Error('Decline failed');
    });

    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={errorOnDecline}
      />
    );

    const declineButton = screen.getByLabelText('Decline call');
    await user.click(declineButton);

    expect(errorOnDecline).toHaveBeenCalled();
  });

  it('should display correct icon for video call', () => {
    const call = createMockCall({ type: 'video' });
    const { container } = render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const videoIcon = container.querySelector('svg');
    expect(videoIcon).toBeInTheDocument();
  });

  it('should display correct icon for voice call', () => {
    const call = createMockCall({ type: 'voice' });
    const { container } = render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const phoneIcon = container.querySelector('svg');
    expect(phoneIcon).toBeInTheDocument();
  });

  it('should have proper button labels', () => {
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByLabelText('Accept call')).toBeInTheDocument();
    expect(screen.getByLabelText('Decline call')).toBeInTheDocument();
  });

  it('should have status role for call description', () => {
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const description = screen.getByRole('status');
    expect(description).toHaveAttribute('aria-live', 'polite');
  });

  it('should handle multiple accept clicks', async () => {
    const user = userEvent.setup();
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const acceptButton = screen.getByLabelText('Accept call');
    await user.click(acceptButton);
    await user.click(acceptButton);

    expect(mockOnAccept).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple decline clicks', async () => {
    const user = userEvent.setup();
    const call = createMockCall();
    render(
      <IncomingCallNotification
        call={call}
        callerName="Alice"
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
      />
    );

    const declineButton = screen.getByLabelText('Decline call');
    await user.click(declineButton);
    await user.click(declineButton);

    expect(mockOnDecline).toHaveBeenCalledTimes(2);
  });

  it('should handle different call statuses', () => {
    const statuses: Call['status'][] = ['ringing', 'connecting', 'initiating'];

    statuses.forEach((status) => {
      const call = createMockCall({ status });
      const { unmount } = render(
        <IncomingCallNotification
          call={call}
          callerName="Alice"
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
        />
      );

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      unmount();
    });
  });
});
