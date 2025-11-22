import { useStorage } from '@/hooks/use-storage';
import type { PlaceCategory } from './types';

interface MapSettings {
  PRIVACY_GRID_METERS: number;
  DEFAULT_RADIUS_KM: number;
  MAX_RADIUS_KM: number;
  MIN_RADIUS_KM: number;
  UNITS: 'metric' | 'imperial';
  COUNTRY_BIAS: string;
  ENABLE_PRECISE_LOCATION: boolean;
  PRECISE_LOCATION_TIMEOUT_MINUTES: number;
  ENABLE_GEOFENCING: boolean;
  ENABLE_LOST_PET_ALERTS: boolean;
  ENABLE_PLAYDATE_PLANNING: boolean;
  ENABLE_PLACE_DISCOVERY: boolean;
  AUTO_CENTER_ON_LOCATION: boolean;
  SHOW_DISTANCE_LABELS: boolean;
  CLUSTER_MARKERS: boolean;
  MAX_MARKERS_VISIBLE: number;
}

interface PlaceCategorySettings {
  categories: PlaceCategory[];
  defaultCategory: string;
  enableUserSubmittedPlaces: boolean;
  requireModeration: boolean;
}

const DEFAULT_MAP_SETTINGS: MapSettings = {
  PRIVACY_GRID_METERS: 1000,
  DEFAULT_RADIUS_KM: 10,
  MAX_RADIUS_KM: 100,
  MIN_RADIUS_KM: 1,
  UNITS: 'metric',
  COUNTRY_BIAS: 'US',
  ENABLE_PRECISE_LOCATION: true,
  PRECISE_LOCATION_TIMEOUT_MINUTES: 60,
  ENABLE_GEOFENCING: true,
  ENABLE_LOST_PET_ALERTS: true,
  ENABLE_PLAYDATE_PLANNING: true,
  ENABLE_PLACE_DISCOVERY: true,
  AUTO_CENTER_ON_LOCATION: true,
  SHOW_DISTANCE_LABELS: true,
  CLUSTER_MARKERS: true,
  MAX_MARKERS_VISIBLE: 50,
};

const DEFAULT_CATEGORY_SETTINGS: PlaceCategorySettings = {
  categories: [
    { id: 'park', name: 'Parks', icon: '🌳', color: '#22c55e' },
    { id: 'vet', name: 'Veterinarians', icon: '🏥', color: '#3b82f6' },
    { id: 'groomer', name: 'Groomers', icon: '✂️', color: '#a855f7' },
    { id: 'cafe', name: 'Pet Cafes', icon: '☕', color: '#f59e0b' },
    { id: 'store', name: 'Pet Stores', icon: '🛒', color: '#ec4899' },
    { id: 'hotel', name: 'Pet Hotels', icon: '🏨', color: '#14b8a6' },
    { id: 'beach', name: 'Dog Beaches', icon: '🏖️', color: '#06b6d4' },
    { id: 'training', name: 'Training Centers', icon: '🎯', color: '#8b5cf6' },
  ],
  defaultCategory: 'park',
  enableUserSubmittedPlaces: true,
  requireModeration: true,
};

export function useMapConfig() {
  const [mapSettings] = useStorage<MapSettings>('admin-map-settings', DEFAULT_MAP_SETTINGS);
  const [categorySettings] = useStorage<PlaceCategorySettings>(
    'admin-map-categories',
    DEFAULT_CATEGORY_SETTINGS
  );

  return {
    mapSettings: mapSettings ?? DEFAULT_MAP_SETTINGS,
    categorySettings: categorySettings ?? DEFAULT_CATEGORY_SETTINGS,
    PLACE_CATEGORIES: categorySettings?.categories ?? DEFAULT_CATEGORY_SETTINGS.categories,
  };
}
