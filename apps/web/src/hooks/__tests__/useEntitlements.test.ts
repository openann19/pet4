import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEntitlements } from '../useEntitlements';
import { PaymentsService } from '@/lib/payments-service';

vi.mock('@/lib/payments-service', () => ({
  PaymentsService: {
    getUserEntitlements: vi.fn(),
  },
}));

const mockPaymentsService = vi.mocked(PaymentsService);

describe('useEntitlements', () => {
  const mockEntitlements = {
    entitlements: ['premium', 'unlimited_likes'] as const,
    consumables: {
      boosts: 5,
      super_likes: 10,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.spark = {
      user: vi.fn().mockResolvedValue({ id: 'user1' }),
    } as never;
    mockPaymentsService.getUserEntitlements.mockResolvedValue(mockEntitlements as never);
  });

  it('loads entitlements on mount', async () => {
    renderHook(() => useEntitlements());

    await waitFor(() => {
      expect(mockPaymentsService.getUserEntitlements).toHaveBeenCalled();
    });
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useEntitlements());

    expect(result.current.loading).toBe(true);
  });

  it('returns entitlements when loaded', async () => {
    const { result } = renderHook(() => useEntitlements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.entitlements).toEqual(mockEntitlements);
  });

  it('checks if user has entitlement', async () => {
    const { result } = renderHook(() => useEntitlements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasEntitlement('premium')).toBe(true);
    expect(result.current.hasEntitlement('unlimited_likes')).toBe(true);
    expect(result.current.hasEntitlement('basic')).toBe(false);
  });

  it('returns consumable count', async () => {
    const { result } = renderHook(() => useEntitlements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getConsumableCount('boosts')).toBe(5);
    expect(result.current.getConsumableCount('super_likes')).toBe(10);
  });

  it('returns 0 for missing consumables', async () => {
    const customEntitlements = {
      entitlements: ['premium'] as const,
      consumables: {
        boosts: 5,
        super_likes: 0,
      },
    };

    mockPaymentsService.getUserEntitlements.mockResolvedValue(customEntitlements as never);

    const { result } = renderHook(() => useEntitlements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.getConsumableCount('super_likes')).toBe(0);
    });
  });

  it('handles loading error', async () => {
    const mockError = new Error('Failed to load');
    mockPaymentsService.getUserEntitlements.mockRejectedValue(mockError);

    const { result } = renderHook(() => useEntitlements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load');
    expect(result.current.entitlements).toBeNull();
  });

  it('refreshes entitlements', async () => {
    const { result } = renderHook(() => useEntitlements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.refresh();

    expect(mockPaymentsService.getUserEntitlements).toHaveBeenCalledTimes(2);
  });

  it('returns false for hasEntitlement when entitlements are null', () => {
    mockPaymentsService.getUserEntitlements.mockResolvedValue(null as never);

    const { result } = renderHook(() => useEntitlements());

    expect(result.current.hasEntitlement('premium')).toBe(false);
  });

  it('returns 0 for getConsumableCount when entitlements are null', () => {
    mockPaymentsService.getUserEntitlements.mockResolvedValue(null as never);

    const { result } = renderHook(() => useEntitlements());

    expect(result.current.getConsumableCount('boosts')).toBe(0);
  });
});
