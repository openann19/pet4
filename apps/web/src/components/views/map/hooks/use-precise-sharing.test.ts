import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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
  const mockSetPreciseSharingEnabled = vi.fn();
  const mockSetPreciseSharingUntil = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      t: {
        map: {
          precisionEnabled: 'Precise location enabled',
          precisionDisabled: 'Precise location disabled',
          precisionExpired: 'Precise location expired',
        },
      },
    });
    (useStorage as unknown as ReturnType<typeof vi.fn>).mockImplementation((key: string, defaultValue: unknown) => {
      if (key === 'map-precise-sharing') {
        return [false, mockSetPreciseSharingEnabled];
      }
      if (key === 'map-precise-until') {
        return [null, mockSetPreciseSharingUntil];
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
    const futureTime = Date.now() + 1000;
    (useStorage as unknown as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'map-precise-sharing') {
        return [true, mockSetPreciseSharingEnabled];
      }
      if (key === 'map-precise-until') {
        return [futureTime, mockSetPreciseSharingUntil];
      }
      return [null, vi.fn()];
    });

    vi.useFakeTimers();
    const { result } = renderHook(() => usePreciseSharing());

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockSetPreciseSharingEnabled).toHaveBeenCalledWith(false);
    });

    vi.useRealTimers();
  });
});

