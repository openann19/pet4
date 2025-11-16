import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMapLocation } from './use-map-location';
import * as mapUtils from '@/lib/maps/utils';
import * as mapConfig from '@/lib/maps/config';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

vi.mock('@/lib/maps/utils');
vi.mock('@/lib/maps/config');
vi.mock('@/contexts/AppContext');
vi.mock('sonner');
vi.mock('@/lib/logger');
vi.mock('@/lib/maps/useMapConfig', () => ({
  useMapConfig: () => ({
    mapSettings: { PRIVACY_GRID_METERS: 100, DEFAULT_RADIUS_KM: 5 },
    PLACE_CATEGORIES: [],
  }),
}));

describe('useMapLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      t: { map: { locationEnabled: 'Location enabled', locationDenied: 'Location denied' } },
    });
    (mapConfig.DEFAULT_LOCATION as unknown) = { lat: 0, lng: 0 };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    vi.spyOn(mapUtils, 'getCurrentLocation').mockResolvedValue({ lat: 10, lng: 20 });
    vi.spyOn(mapUtils, 'snapToGrid').mockReturnValue({ lat: 10, lng: 20 });

    const { result } = renderHook(() => useMapLocation());

    expect(result.current.locationPermission).toBe('prompt');
    expect(result.current.isLocating).toBe(true);
  });

  it('should request location on mount', async () => {
    const mockLocation = { lat: 10, lng: 20 };
    const mockCoarse = { lat: 10, lng: 20 };
    vi.spyOn(mapUtils, 'getCurrentLocation').mockResolvedValue(mockLocation);
    vi.spyOn(mapUtils, 'snapToGrid').mockReturnValue(mockCoarse);

    const { result } = renderHook(() => useMapLocation());

    await waitFor(() => {
      expect(result.current.isLocating).toBe(false);
    });

    expect(result.current.userLocation).toEqual(mockLocation);
    expect(result.current.coarseLocation).toEqual(mockCoarse);
    expect(result.current.locationPermission).toBe('granted');
    expect(toast.success).toHaveBeenCalled();
  });

  it('should handle location error gracefully', async () => {
    const error = new Error('Permission denied');
    vi.spyOn(mapUtils, 'getCurrentLocation').mockRejectedValue(error);

    const { result } = renderHook(() => useMapLocation());

    await waitFor(() => {
      expect(result.current.isLocating).toBe(false);
    });

    expect(result.current.locationPermission).toBe('denied');
    expect(result.current.userLocation).toEqual(mapConfig.DEFAULT_LOCATION);
    expect(result.current.coarseLocation).toEqual(mapConfig.DEFAULT_LOCATION);
    expect(toast.error).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should allow manual location request', async () => {
    const mockLocation = { lat: 15, lng: 25 };
    const mockCoarse = { lat: 15, lng: 25 };
    vi.spyOn(mapUtils, 'getCurrentLocation').mockResolvedValue(mockLocation);
    vi.spyOn(mapUtils, 'snapToGrid').mockReturnValue(mockCoarse);

    const { result } = renderHook(() => useMapLocation());

    await waitFor(() => {
      expect(result.current.isLocating).toBe(false);
    });

    vi.spyOn(mapUtils, 'getCurrentLocation').mockResolvedValue({ lat: 30, lng: 40 });
    vi.spyOn(mapUtils, 'snapToGrid').mockReturnValue({ lat: 30, lng: 40 });

    await result.current.requestLocation();

    await waitFor(() => {
      expect(result.current.userLocation?.lat).toBe(30);
    });
  });
});

