import { useMemo } from 'react';
import type { Place, MapMarker, Location } from '@/lib/maps/types';
import type { UseMapLocationReturn } from './use-map-location';
import type { UsePreciseSharingReturn } from './use-precise-sharing';
import type { UseMapUIStateReturn } from './use-map-ui-state';

export interface UseMapViewLogicReturn {
  displayLocation: Location | null;
  handlePlaceClick: (place: Place) => void;
}

export function useMapViewLogic(
  location: UseMapLocationReturn,
  preciseSharing: UsePreciseSharingReturn,
  uiState: UseMapUIStateReturn
): UseMapViewLogicReturn {
  const displayLocation = useMemo(
    () =>
      preciseSharing.preciseSharingEnabled && location.userLocation
        ? location.userLocation
        : location.coarseLocation,
    [preciseSharing.preciseSharingEnabled, location.userLocation, location.coarseLocation]
  );

  const handlePlaceClick = (place: Place): void => {
    const marker: MapMarker = {
      id: place.id,
      type: 'place',
      location: place.location,
      data: place,
    };
    uiState.setSelectedMarker(marker);
    uiState.setShowList(false);
  };

  return {
    displayLocation,
    handlePlaceClick,
  };
}

