/**
 * Map Config API (Mobile)
 *
 * API client for map configuration management.
 */

import { apiClient } from '../utils/api-client';
import { createLogger } from '../utils/logger';

const logger = createLogger('MapConfigAPI');

export interface MapSettings {
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

export interface PlaceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface PlaceCategorySettings {
  categories: PlaceCategory[];
  defaultCategory: string;
  enableUserSubmittedPlaces: boolean;
  requireModeration: boolean;
}

export interface MapConfig {
  settings: MapSettings;
  categorySettings: PlaceCategorySettings;
  providerConfig?: {
    provider: string;
    apiKey?: string;
    [key: string]: unknown;
  };
}

/**
 * Get map configuration
 */
export async function getMapConfig(): Promise<MapConfig | null> {
  try {
    const response = await apiClient.get<{ config: MapConfig | null }>('/v1/admin/config/map');
    if ('config' in response) {
      return response.config;
    }
    return (response as unknown as MapConfig) || null;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get map config', err);
    throw err;
  }
}

/**
 * Update map configuration
 */
export async function updateMapConfig(config: MapConfig, updatedBy: string): Promise<MapConfig> {
  try {
    const response = await apiClient.put<{ config: MapConfig }>('/v1/admin/config/map', {
      config,
      updatedBy,
    });
    if ('config' in response) {
      return response.config;
    }
    return response as unknown as MapConfig;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update map config', err, { updatedBy });
    throw err;
  }
}
