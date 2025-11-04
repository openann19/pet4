import type { Location } from './types';

export const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371;
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lng - loc1.lng);
  const lat1 = toRad(loc1.lat);
  const lat2 = toRad(loc2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => {
  return (deg * Math.PI) / 180;
};

export const snapToGrid = (location: Location, gridSizeMeters: number): Location => {
  const gridSizeDeg = gridSizeMeters / 111000;
  return {
    lat: Math.floor(location.lat / gridSizeDeg) * gridSizeDeg + gridSizeDeg / 2,
    lng: Math.floor(location.lng / gridSizeDeg) * gridSizeDeg + gridSizeDeg / 2,
  };
};

export const calculateMidpoint = (locations: Location[]): Location => {
  if (locations.length === 0) {
    throw new Error('Cannot calculate midpoint of empty array');
  }
  
  const sum = locations.reduce(
    (acc, loc) => ({
      lat: acc.lat + loc.lat,
      lng: acc.lng + loc.lng,
    }),
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / locations.length,
    lng: sum.lng / locations.length,
  };
};

export const formatDistance = (km: number, units: 'metric' | 'imperial' = 'metric'): string => {
  if (units === 'imperial') {
    const miles = km * 0.621371;
    return miles < 1
      ? `${Math.round(miles * 5280)} ft`
      : `${miles.toFixed(1)} mi`;
  }
  
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

export const isLocationWithinRadius = (
  center: Location,
  point: Location,
  radiusKm: number
): boolean => {
  return calculateDistance(center, point) <= radiusKm;
};

export const getCurrentLocation = (): Promise<Location> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(error.message));
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
};

export const watchLocation = (
  callback: (location: Location) => void,
  onError?: (error: GeolocationPositionError) => void
): number => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }
  
  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    onError,
    {
      enableHighAccuracy: false,
      maximumAge: 30000,
      timeout: 27000,
    }
  );
};

export const clearLocationWatch = (watchId: number): void => {
  navigator.geolocation.clearWatch(watchId);
};
