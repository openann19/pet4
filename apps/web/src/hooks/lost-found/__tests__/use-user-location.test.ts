import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserLocation } from '../use-user-location';

describe('useUserLocation', () => {
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should get user location successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.006,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useUserLocation());

    await result.current.getUserLocation();

    await waitFor(() => {
      expect(result.current.userLocation).toEqual({
        lat: 40.7128,
        lon: -74.006,
      });
    });
  });

  it('should handle geolocation error gracefully', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((_success, error) => {
      if (error) {
        setTimeout(() => {
          error(new Error('Permission denied'));
        }, 0);
      }
    });

    const { result } = renderHook(() => useUserLocation());

    await result.current.getUserLocation();

    // Error callback doesn't update state, so location remains null
    expect(result.current.userLocation).toBeNull();
  });

  it('should handle missing geolocation', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useUserLocation());

    await result.current.getUserLocation();

    expect(result.current.userLocation).toBeNull();
  });
});

