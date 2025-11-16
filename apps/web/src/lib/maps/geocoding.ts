import { getGeocodingUrl, getGeocodingApiKey } from './provider-config';
import type { Location } from './types';
import { createLogger } from '../logger';

const logger = createLogger('GeocodingService');

export interface GeocodingResult {
  id: string;
  name: string;
  address: string;
  location: Location;
  placeType?: string;
  relevance?: number;
}

export interface GeocodingMetrics {
  requestId: string;
  query: string;
  latency: number;
  resultCount: number;
  error?: string;
}

let requestIdCounter = 0;

function generateRequestId(): string {
  return `geocoding_${String(Date.now() ?? '')}_${String(++requestIdCounter ?? '')}`;
}

export async function forwardGeocode(
  query: string,
  language: 'en' | 'bg' = 'en',
  proximity?: Location
): Promise<GeocodingResult[]> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const apiKey = getGeocodingApiKey();
    const baseUrl = getGeocodingUrl();

    if (!apiKey) {
      logger.warn('No geocoding API key configured', { requestId });
      return [];
    }

    const params = new URLSearchParams({
      q: query,
      language,
      limit: '10',
      ...(proximity && {
        proximity: `${String(proximity.lng ?? '')},${String(proximity.lat ?? '')}`,
      }),
    });

    const url = `${baseUrl}/${encodeURIComponent(query)}.json?${params.toString()}&key=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${String(response.statusText ?? '')}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    const results: GeocodingResult[] = (data.features ?? []).map(
      (feature: {
        id: string;
        place_name: string;
        center: [number, number];
        place_type: string[];
        relevance?: number;
        properties?: Record<string, unknown>;
      }) => ({
        id: feature.id ?? `place_${Date.now()}_${Math.random()}`,
        name: feature.place_name ?? query,
        address: feature.place_name ?? '',
        location: {
          lng: feature.center[0],
          lat: feature.center[1],
        },
        placeType: feature.place_type?.[0],
        relevance: feature.relevance,
      })
    );

    const metrics: GeocodingMetrics = {
      requestId,
      query,
      latency,
      resultCount: results.length,
    };

    logger.info('Geocoding completed', metrics);
    trackGeocodingMetrics(metrics);

    return results;
  } catch (error) {
    const latency = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));

    const metrics: GeocodingMetrics = {
      requestId,
      query,
      latency,
      resultCount: 0,
      error: err.message,
    };

    logger.error('Geocoding failed', err, metrics);
    trackGeocodingMetrics(metrics);

    return [];
  }
}

export async function reverseGeocode(
  location: Location,
  language: 'en' | 'bg' = 'en'
): Promise<GeocodingResult | null> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const apiKey = getGeocodingApiKey();
    const baseUrl = getGeocodingUrl();

    if (!apiKey) {
      logger.warn('No geocoding API key configured', { requestId });
      return null;
    }

    const params = new URLSearchParams({
      language,
    });

    const url = `${baseUrl}/${location.lng},${location.lat}.json?${params.toString()}&key=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${String(response.statusText ?? '')}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    const feature = data.features?.[0];
    if (!feature) {
      return null;
    }

    const result: GeocodingResult = {
      id: feature.id ?? `place_${Date.now()}_${Math.random()}`,
      name: feature.place_name ?? 'Unknown location',
      address: feature.place_name ?? '',
      location: {
        lng: feature.center[0],
        lat: feature.center[1],
      },
      placeType: feature.place_type?.[0],
      relevance: feature.relevance,
    };

    const metrics: GeocodingMetrics = {
      requestId,
      query: `${String(location.lat ?? '')},${String(location.lng ?? '')}`,
      latency,
      resultCount: 1,
    };

    logger.info('Reverse geocoding completed', metrics);
    trackGeocodingMetrics(metrics);

    return result;
  } catch (error) {
    const latency = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));

    const metrics: GeocodingMetrics = {
      requestId,
      query: `${String(location.lat ?? '')},${String(location.lng ?? '')}`,
      latency,
      resultCount: 0,
      error: err.message,
    };

    logger.error('Reverse geocoding failed', err, metrics);
    trackGeocodingMetrics(metrics);

    return null;
  }
}

const geocodingMetrics: GeocodingMetrics[] = [];

function trackGeocodingMetrics(metrics: GeocodingMetrics): void {
  geocodingMetrics.push(metrics);

  if (geocodingMetrics.length > 1000) {
    geocodingMetrics.shift();
  }
}

export function getGeocodingReport(): {
  totalRequests: number;
  averageLatency: number;
  errorRate: number;
  recentMetrics: GeocodingMetrics[];
} {
  const recent = geocodingMetrics.slice(-100);
  const totalRequests = recent.length;
  const errors = recent.filter((m) => m.error).length;
  const totalLatency = recent.reduce((sum, m) => sum + m.latency, 0);

  return {
    totalRequests,
    averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
    errorRate: totalRequests > 0 ? errors / totalRequests : 0,
    recentMetrics: recent.slice(-20),
  };
}
