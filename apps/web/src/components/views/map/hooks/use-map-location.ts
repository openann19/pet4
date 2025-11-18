import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_LOCATION } from '@/lib/maps/config';
import { getCurrentLocation, snapToGrid } from '@/lib/maps/utils';
import type { Location } from '@/lib/maps/types';
import { useMapConfig } from '@/lib/maps/useMapConfig';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';

export interface UseMapLocationReturn {
  userLocation: Location | null;
  coarseLocation: Location | null;
  locationPermission: 'granted' | 'denied' | 'prompt';
  isLocating: boolean;
  requestLocation: () => Promise<void>;
}

export function useMapLocation(): UseMapLocationReturn {
  const { t } = useApp();
  const { mapSettings } = useMapConfig();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [coarseLocation, setCoarseLocation] = useState<Location | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isLocating, setIsLocating] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const requestLocation = useCallback(async (): Promise<void> => {
    setIsLocating(true);
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
      const coarse = snapToGrid(location, mapSettings.PRIVACY_GRID_METERS);
      setCoarseLocation(coarse);
      setLocationPermission('granted');
      toast.success(t.map?.locationEnabled ?? 'Location enabled');
    } catch (_error) {
      const err = _error instanceof Error ? _error : new Error(String(_error));
      logger.error('Location _error', err, { action: 'getUserLocation' });
      setLocationPermission('denied');
      setUserLocation(DEFAULT_LOCATION);
      setCoarseLocation(DEFAULT_LOCATION);
      toast.error(t.map?.locationDenied ?? 'Location access denied. Using default location.');
    } finally {
      setIsLocating(false);
    }
  }, [mapSettings.PRIVACY_GRID_METERS, t]);

  useEffect(() => {
    void requestLocation();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestLocation]);

  return {
    userLocation,
    coarseLocation,
    locationPermission,
    isLocating,
    requestLocation,
  };
}

