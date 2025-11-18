import { useCallback, useState } from 'react';
import { createLogger } from '@/lib/logger';
import { isTruthy } from '@petspark/shared';

const logger = createLogger('useUserLocation');

interface UseUserLocationReturn {
  userLocation: { lat: number; lon: number } | null;
  getUserLocation: () => Promise<void>;
}

export function useUserLocation(): UseUserLocationReturn {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const getUserLocation = useCallback(async () => {
    try {
      if (isTruthy(navigator.geolocation)) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          () => {
            // User denied or error getting location
          }
        );
      }
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Failed to get user location', err, {
        action: 'getUserLocation',
      });
    }
  }, []);

  return {
    userLocation,
    getUserLocation,
  };
}

