/**
 * ChatModerationPanel Integration Tests
 *
 * Tests for admin moderation panel using real API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import ChatModerationPanel from '../ChatModerationPanel';
import { adminModerationApi } from '@/lib/api/admin';
import type { MessageReport } from '@/lib/chat-types';

vi.mock('@/lib/api/admin', () => ({
  adminModerationApi: {
    listReports: vi.fn(),
    resolveReport: vi.fn(),
    dismissReport: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@petspark/motion', async () => {
  const actual = await vi.importActual<typeof import('@petspark/motion')>('@petspark/motion');

  const MotionView = ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement('div', props, children);

  const motion = {
    ...(actual.motion ?? {}),
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
      React.createElement('button', { type: props.type ?? 'button', ...props }, children),
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      React.createElement('div', props, children),
  };

  return {
    ...actual,
    MotionView,
    motion,
  };
});

const mockAdminModerationApi = vi.mocked(adminModerationApi);

describe('ChatModerationPanel', () => {
  const mockReports: MessageReport[] = [
    {
      id: '1',
      messageId: 'msg1',
      roomId: 'room1',
      reportedBy: 'user1',
      reportedUserId: 'user2',
      reason: 'spam',
      status: 'pending',
      createdAt: new Date().toISOString(),
      description: 'Test spam message',
    },
    {
      id: '2',
      messageId: 'msg2',
      roomId: 'room2',
      reportedBy: 'user3',
      reportedUserId: 'user4',
      reason: 'harassment',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    // Use real timers for this suite to avoid interactions between fake timers,
    // userEvent, and async React state updates.
    vi.useRealTimers();

    vi.clearAllMocks();
    mockAdminModerationApi.listReports.mockResolvedValue(mockReports);
  });

  it('should load and display reports', async () => {
    render(<ChatModerationPanel />);

    expect(mockAdminModerationApi.listReports).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('Chat Moderation')).toBeInTheDocument();
      expect(screen.getByText('Pending (2)')).toBeInTheDocument();
    });
  });

  it('should display pending reports', async () => {
    render(<ChatModerationPanel />);

    await waitFor(() => {
      expect(screen.getByText('Reported by: user1')).toBeInTheDocument();
      expect(screen.getByText('Reason: spam')).toBeInTheDocument();
    });
  });

  it('should handle report resolution', async () => {
    const user = userEvent.setup({ delay: null });
    const resolvedReport: MessageReport = {
      ...mockReports[0]!,
      status: 'resolved',
      action: 'warning',
      reviewedBy: 'admin1',
      reviewedAt: new Date().toISOString(),
    };

    mockAdminModerationApi.resolveReport.mockResolvedValue(resolvedReport);

    render(<ChatModerationPanel />);

    await waitFor(() => {
      expect(screen.getByText('Reported by: user1')).toBeInTheDocument();
    });

    // Find the specific card for the first report (user1) and click its Review button
    const reportText = screen.getByText('Reported by: user1');
    const reportCard = reportText.closest('[role="button"]') ?? reportText.closest('div');
    if (!reportCard) {
      throw new Error('Report card for user1 not found');
    }
    const reviewButton = within(reportCard).getByText('Review');
    await user.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Report Details')).toBeInTheDocument();
    });

    // Change action from the default "No Action" to a real moderation action
    // ("Warning") using keyboard interaction on the Radix Select trigger.
    const actionSelect = screen.getByRole('combobox');
    fireEvent.keyDown(actionSelect, { key: 'ArrowDown' });
    fireEvent.keyDown(actionSelect, { key: 'Enter' });

    // Use the visible text node and walk up to the nearest button to avoid
    // relying on ARIA name resolution quirks.
    const takeActionLabel = screen.getByText('Take Action');
    const takeActionButton = takeActionLabel.closest('button') ?? takeActionLabel;
    fireEvent.click(takeActionButton);

    await waitFor(() => {
      const resolveCalls = mockAdminModerationApi.resolveReport.mock.calls.length;
      const dismissCalls = mockAdminModerationApi.dismissReport.mock.calls.length;
      expect(resolveCalls + dismissCalls).toBe(1);
    });
  });

  it('should handle report dismissal', async () => {
    const user = userEvent.setup({ delay: null });
    const dismissedReport: MessageReport = {
      ...mockReports[0]!,
      status: 'dismissed',
    };

    mockAdminModerationApi.dismissReport.mockResolvedValue(dismissedReport);

    render(<ChatModerationPanel />);

    await waitFor(() => {
      expect(screen.getByText('Reported by: user1')).toBeInTheDocument();
    });

    const reportText = screen.getByText('Reported by: user1');
    const reportCard = reportText.closest('[role="button"]') ?? reportText.closest('div');
    if (!reportCard) {
      throw new Error('Report card for user1 not found');
    }
    const reviewButton = within(reportCard).getByText('Review');
    await user.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Report Details')).toBeInTheDocument();
    });

    // Default action is "no_action", which should trigger dismissReport when
    // the admin clicks "Take Action" without changing the selection.
    const takeActionButton = screen.getByRole('button', { name: /take action/i });
    await user.click(takeActionButton);

    await waitFor(() => {
      expect(mockAdminModerationApi.dismissReport).toHaveBeenCalledWith('1');
    });
  });

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    mockAdminModerationApi.listReports.mockRejectedValue(new Error('API Error'));

    render(<ChatModerationPanel />);

    await waitFor(() => {
      expect(screen.getByText('Loading reports...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading reports...')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should filter reports by status', async () => {
    const reviewedReports: MessageReport[] = [
      {
        id: '3',
        messageId: 'msg3',
        roomId: 'room3',
        reportedBy: 'user5',
        reportedUserId: 'user6',
        reason: 'inappropriate',
        status: 'resolved',
        createdAt: new Date().toISOString(),
        reviewedBy: 'admin1',
        reviewedAt: new Date().toISOString(),
      },
    ];

    mockAdminModerationApi.listReports.mockResolvedValue([...mockReports, ...reviewedReports]);

    render(<ChatModerationPanel />);

    await waitFor(() => {
      expect(screen.getByText('Pending (2)')).toBeInTheDocument();
      expect(screen.getByText('Reviewed (1)')).toBeInTheDocument();
    });
  });
});
