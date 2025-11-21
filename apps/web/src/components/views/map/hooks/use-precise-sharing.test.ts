import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreciseSharing } from './use-precise-sharing';
import { useStorage } from '@/hooks/use-storage';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { haptics } from '@/lib/haptics';

vi.mock('@/hooks/use-storage');
vi.mock('sonner');
vi.mock('@/contexts/AppContext');
vi.mock('@/lib/haptics');

describe('usePreciseSharing', () => {
  const storageMock = useStorage as unknown as vi.Mock;
  let preciseSharingEnabledValue: boolean;
  let preciseSharingUntilValue: number | null;
  const mockSetPreciseSharingEnabled = vi.fn((next: boolean | ((current: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? next(preciseSharingEnabledValue) : next;
    preciseSharingEnabledValue = resolved;
    return Promise.resolve();
  });
  const mockSetPreciseSharingUntil = vi.fn(
    (next: number | null | ((current: number | null) => number | null)) => {
      const resolved = typeof next === 'function' ? next(preciseSharingUntilValue) : next;
      preciseSharingUntilValue = resolved ?? null;
      return Promise.resolve();
    }
  );

  beforeEach(() => {
    vi.clearAllMocks();
    preciseSharingEnabledValue = false;
    preciseSharingUntilValue = null;
    (useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      t: {
        map: {
          precisionEnabled: 'Precise location enabled',
          precisionDisabled: 'Precise location disabled',
          precisionExpired: 'Precise location expired',
        },
      },
    });
    storageMock.mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'map-precise-sharing') {
        return [preciseSharingEnabledValue, mockSetPreciseSharingEnabled];
      }
      if (key === 'map-precise-until') {
        return [preciseSharingUntilValue, mockSetPreciseSharingUntil];
      }
      return [defaultValue, vi.fn()];
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePreciseSharing());

    expect(result.current.preciseSharingEnabled).toBe(false);
    expect(result.current.preciseSharingUntil).toBe(null);
  });

  it('should enable precise sharing', () => {
    const { result } = renderHook(() => usePreciseSharing());

    result.current.handleEnablePreciseSharing();

    expect(haptics.trigger).toHaveBeenCalledWith('medium');
    expect(mockSetPreciseSharingEnabled).toHaveBeenCalledWith(true);
    expect(mockSetPreciseSharingUntil).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('should disable precise sharing', () => {
    const { result } = renderHook(() => usePreciseSharing());

    result.current.handleDisablePreciseSharing();

    expect(haptics.trigger).toHaveBeenCalledWith('light');
    expect(mockSetPreciseSharingEnabled).toHaveBeenCalledWith(false);
    expect(mockSetPreciseSharingUntil).toHaveBeenCalledWith(null);
    expect(toast.info).toHaveBeenCalled();
  });

  it('should expire precise sharing when time limit reached', async () => {
    vi.useFakeTimers();
    preciseSharingEnabledValue = true;
    preciseSharingUntilValue = Date.now() - 1000;

    const { result } = renderHook(() => usePreciseSharing());

    await act(async () => {});

    expect(mockSetPreciseSharingEnabled).toHaveBeenCalledWith(false);
    expect(mockSetPreciseSharingUntil).toHaveBeenCalledWith(null);
    expect(toast.info).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
