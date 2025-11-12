import type { Location } from './types';
import { snapToGrid } from './utils';
import { isTruthy, isDefined } from '@petspark/shared';

export interface PrivacyLocation extends Location {
  isPrecise: boolean;
  sessionId: string;
}

let sessionId = `session_${String(Date.now() ?? '')}_${String(Math.random().toString(36).substr(2, 9) ?? '')}`;

export function applyPrivacyToLocation(
  location: Location,
  isPreciseSharing: boolean,
  gridSizeMeters: number
): PrivacyLocation {
  if (isTruthy(isPreciseSharing)) {
    return {
      ...location,
      isPrecise: true,
      sessionId,
    };
  }

  const coarse = snapToGrid(location, gridSizeMeters);

  const jitterRange = 0.002;
  const jitterLat = (Math.random() - 0.5) * jitterRange;
  const jitterLng = (Math.random() - 0.5) * jitterRange;

  return {
    lat: coarse.lat + jitterLat,
    lng: coarse.lng + jitterLng,
    isPrecise: false,
    sessionId,
  };
}

export function getPrivacyBlurredLocation(location: Location, gridSizeMeters = 500): Location {
  const coarse = snapToGrid(location, gridSizeMeters);

  const jitterRange = 0.003;
  const jitterLat = (Math.random() - 0.5) * jitterRange;
  const jitterLng = (Math.random() - 0.5) * jitterRange;

  return {
    lat: coarse.lat + jitterLat,
    lng: coarse.lng + jitterLng,
  };
}

export function resetPrivacySession(): void {
  sessionId = `session_${String(Date.now() ?? '')}_${String(Math.random().toString(36).substr(2, 9) ?? '')}`;
}

export function degradePrecisionOverTime(
  location: Location,
  createdAt: Date,
  gridSizeMeters = 500
): Location {
  const now = Date.now();
  const ageInHours = (now - createdAt.getTime()) / (1000 * 60 * 60);

  const degradationFactor = Math.min(ageInHours / 24, 2);
  const degradedGridSize = gridSizeMeters * (1 + degradationFactor);

  return snapToGrid(location, degradedGridSize);
}
