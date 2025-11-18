import type { Location } from './types';
import { createLogger } from '../logger';
import { getMapsConfig } from '../api-config';

const logger = createLogger('MapboxPlaces');

export interface MapboxPlace {
  id: string;
  name: string;
  address: string;
  type: 'park' | 'cafe' | 'beach' | 'trail' | 'other';
  location: Location;
  distance?: number;
  rating?: number;
  category?: string;
  phone?: string;
  website?: string;
}

interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
    mapbox_id?: string;
    [key: string]: unknown;
  };
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context?: {
    id: string;
    short_code?: string;
    text: string;
    [key: string]: unknown;
  }[];
}

interface MapboxResponse {
  type: string;
  features: MapboxFeature[];
  attribution?: string;
}

async function getMapboxAccessToken(): Promise<string> {
  const mapsConfig = await getMapsConfig();
  if (!mapsConfig || !mapsConfig.enabled || mapsConfig.provider !== 'mapbox') {
    return '';
  }
  return mapsConfig.apiKey ?? '';
}

function getPlaceTypeFromCategory(category: string): 'park' | 'cafe' | 'beach' | 'trail' | 'other' {
  const lowerCategory = category.toLowerCase();

  if (lowerCategory.includes('park') || lowerCategory.includes('dog')) {
    return 'park';
  }
  if (lowerCategory.includes('cafe') || lowerCategory.includes('restaurant')) {
    return 'cafe';
  }
  if (lowerCategory.includes('beach')) {
    return 'beach';
  }
  if (lowerCategory.includes('trail') || lowerCategory.includes('hiking')) {
    return 'trail';
  }

  return 'other';
}

function calculateDistance(origin: Location, destination: Location): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function searchNearbyPlaces(
  location: Location,
  radiusKm = 5,
  limit = 20
): Promise<MapboxPlace[]> {
  const accessToken = await getMapboxAccessToken();
  if (!accessToken) {
    logger.warn('Mapbox not configured or disabled, returning empty results');
    return [];
  }

  try {
    // Search for pet-friendly places near location
    const searchQuery = encodeURIComponent('dog park');

    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${searchQuery}.json`);
    url.searchParams.set('proximity', `${location.lng},${location.lat}`);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('types', 'poi');

    logger.debug('Searching Mapbox places', {
      location,
      radiusKm,
      limit,
      url: url.toString().replace(accessToken, 'TOKEN'),
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Mapbox API error', new Error(`HTTP ${response.status}: ${errorText}`), {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }

    const data: MapboxResponse = await response.json();

    const places: MapboxPlace[] = data.features
      .filter((feature) => {
        // Filter by distance from center
        const placeLocation: Location = {
          lat: feature.center[1],
          lng: feature.center[0],
        };
        const distance = calculateDistance(location, placeLocation);
        return distance <= radiusKm;
      })
      .slice(0, limit)
      .map((feature) => {
        const placeLocation: Location = {
          lat: feature.center[1],
          lng: feature.center[0],
        };

        const distance = calculateDistance(location, placeLocation);

        // Extract address from place_name or context
        let address = feature.place_name;
        if (feature.context && feature.context.length > 0) {
          const addressParts = feature.context
            .filter((ctx) => ctx.id.startsWith('postcode') || ctx.id.startsWith('place'))
            .map((ctx) => ctx.text);
          if (addressParts.length > 0) {
            address = `${feature.text}, ${addressParts.join(', ')}`;
          }
        }

        // Determine category from place_type
        const category = feature.place_type[0] ?? 'poi';
        const type = getPlaceTypeFromCategory(category);

        return {
          id: feature.id,
          name: feature.text,
          address,
          type,
          location: placeLocation,
          distance,
          category,
          // rating is optional, omit if not available
        };
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    logger.info('Found nearby places', {
      count: places.length,
      location,
      radiusKm,
    });

    return places;
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Failed to search nearby places', err, {
      location,
      radiusKm,
    });
    throw err;
  }
}

export async function searchPlacesByQuery(
  query: string,
  location?: Location,
  limit = 10
): Promise<MapboxPlace[]> {
  const accessToken = await getMapboxAccessToken();
  if (!accessToken) {
    logger.warn('Mapbox not configured or disabled, returning empty results');
    return [];
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json`);
    if (location) {
      url.searchParams.set('proximity', `${location.lng},${location.lat}`);
    }
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('access_token', accessToken);

    logger.debug('Searching Mapbox places by query', {
      query,
      location,
      limit,
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Mapbox API error', new Error(`HTTP ${response.status}: ${errorText}`), {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
    }

    const data: MapboxResponse = await response.json();

    const places: MapboxPlace[] = data.features.slice(0, limit).map((feature) => {
      const placeLocation: Location = {
        lat: feature.center[1],
        lng: feature.center[0],
      };

      let address = feature.place_name;
      if (feature.context && feature.context.length > 0) {
        const addressParts = feature.context
          .filter((ctx) => ctx.id.startsWith('postcode') || ctx.id.startsWith('place'))
          .map((ctx) => ctx.text);
        if (addressParts.length > 0) {
          address = `${feature.text}, ${addressParts.join(', ')}`;
        }
      }

      const category = feature.place_type[0] ?? 'poi';
      const type = getPlaceTypeFromCategory(category);

      const place: MapboxPlace = {
        id: feature.id,
        name: feature.text,
        address,
        type,
        location: placeLocation,
        category,
      };

      if (location) {
        place.distance = calculateDistance(location, placeLocation);
      }

      return place;
    });

    if (location) {
      places.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }

    logger.info('Found places by query', {
      query,
      count: places.length,
    });

    return places;
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Failed to search places by query', err, {
      query,
      location,
    });
    throw err;
  }
}
