/**
 * ChatModerationPanel Integration Tests
 *
 * Tests for admin moderation panel using real API endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('@petspark/motion', () => ({
  MotionView: ({
    children,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <div className={className} onClick={() => void onClick()}>
      {children}
    </div>
  ),
}));

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
    const user = userEvent.setup();
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

    const reviewButtons = screen.getAllByText('Review');
    const reviewButton = reviewButtons[0];
    if (!reviewButton) {
      throw new Error('Review button not found');
    }
    await user.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Report Details')).toBeInTheDocument();
    });

    const takeActionButton = screen.getByText('Take Action');
    await userEvent.click(takeActionButton);

    await waitFor(() => {
      expect(mockAdminModerationApi.resolveReport).toHaveBeenCalledWith('1', expect.any(String));
    });
  });

  it('should handle report dismissal', async () => {
    const user = userEvent.setup();
    const dismissedReport: MessageReport = {
      ...mockReports[0]!,
      status: 'dismissed',
    };

    mockAdminModerationApi.dismissReport.mockResolvedValue(dismissedReport);

    render(<ChatModerationPanel />);

    await waitFor(() => {
      expect(screen.getByText('Reported by: user1')).toBeInTheDocument();
    });

    const reviewButtons = screen.getAllByText('Review');
    const reviewButton = reviewButtons[0];
    if (!reviewButton) {
      throw new Error('Review button not found');
    }
    await user.click(reviewButton);

    await waitFor(() => {
      expect(screen.getByText('Report Details')).toBeInTheDocument();
    });

    // Select "No Action" which triggers dismiss
    const actionSelect = screen.getByRole('combobox');
    await userEvent.click(actionSelect);
    const noActionOption = screen.getByText('No Action');
    await userEvent.click(noActionOption);

    const takeActionButton = screen.getByText('Take Action');
    await userEvent.click(takeActionButton);

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
