import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLostFoundAlerts } from '../use-lost-found-alerts';
import { lostFoundAPI } from '@/api/lost-found-api';
import { toast } from 'sonner';

vi.mock('@/api/lost-found-api');
vi.mock('sonner');

describe('useLostFoundAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as { spark?: { user: () => Promise<{ id: string }> } }).spark = {
      user: vi.fn().mockResolvedValue({ id: 'user-1' }),
    };
  });

  it('should load alerts in browse mode', async () => {
    const mockAlerts = [
      {
        id: 'alert-1',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        petSummary: { name: 'Fluffy', species: 'cat' },
        lastSeen: { description: 'Near park' },
      },
    ];

    vi.mocked(lostFoundAPI.queryAlerts).mockResolvedValue({
      alerts: mockAlerts,
      nextCursor: undefined,
    });

    const { result } = renderHook(() =>
      useLostFoundAlerts({
        viewMode: 'browse',
        activeTab: 'all',
        userLocation: null,
      })
    );

    await result.current.loadAlerts();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.alerts).toEqual(mockAlerts);
    expect(lostFoundAPI.queryAlerts).toHaveBeenCalled();
  });

  it('should load user alerts in mine mode', async () => {
    const mockAlerts = [
      {
        id: 'alert-1',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        petSummary: { name: 'Fluffy', species: 'cat' },
        lastSeen: { description: 'Near park' },
      },
    ];

    vi.mocked(lostFoundAPI.getUserAlerts).mockResolvedValue(mockAlerts);

    const { result } = renderHook(() =>
      useLostFoundAlerts({
        viewMode: 'mine',
        activeTab: 'all',
        userLocation: null,
      })
    );

    await result.current.loadAlerts();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.alerts).toEqual(mockAlerts);
    expect(lostFoundAPI.getUserAlerts).toHaveBeenCalledWith('user-1');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(lostFoundAPI.queryAlerts).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() =>
      useLostFoundAlerts({
        viewMode: 'browse',
        activeTab: 'all',
        userLocation: null,
      })
    );

    await result.current.loadAlerts();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Failed to load lost & found alerts'
    );
  });
});

