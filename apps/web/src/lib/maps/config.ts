import type { MapConfig } from './types';

const ENV = import.meta.env['MODE'] || 'development';

export const BASE_CONFIGS: Record<string, Partial<MapConfig>> = {
  development: {
    MAP_STYLE_URL: 'https://api.maptiler.com/maps/streets-v2/style.json',
    TILES_SOURCE: 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.png',
    GEOCODER_ENDPOINT: '/api/geocode',
    PLACES_ENDPOINT: '/api/places',
    ROUTING_ENDPOINT: '/api/routes',
  },
  staging: {
    MAP_STYLE_URL: 'https://api.maptiler.com/maps/streets-v2/style.json',
    TILES_SOURCE: 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.png',
    GEOCODER_ENDPOINT: '/api/geocode',
    PLACES_ENDPOINT: '/api/places',
    ROUTING_ENDPOINT: '/api/routes',
  },
  production: {
    MAP_STYLE_URL: 'https://api.maptiler.com/maps/streets-v2/style.json',
    TILES_SOURCE: 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.png',
    GEOCODER_ENDPOINT: '/api/geocode',
    PLACES_ENDPOINT: '/api/places',
    ROUTING_ENDPOINT: '/api/routes',
  },
};

export const getBaseMapConfig = (): Partial<MapConfig> => {
  const config = BASE_CONFIGS[ENV] || BASE_CONFIGS['development'];
  return config ?? {};
};

export const DEFAULT_LOCATION = {
  lat: 40.7128,
  lng: -74.006,
};
