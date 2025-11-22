import { useEffect, useRef, useState } from 'react';
// Dynamic runtime import for maplibre-gl to avoid bundling into main chunk.
// We keep type-only imports so TypeScript can validate without pulling runtime.
import type { Map as MapInstance, Marker as MarkerInstance, MapMouseEvent } from 'maplibre-gl';
import type { Location } from '@/lib/maps/types';
import { getMapStyleUrl } from './provider-config';
import { isTruthy } from '@petspark/shared';

export interface MapMarker {
  id: string;
  location: Location;
  data: unknown;
  icon?: string;
  color?: string;
}

// Minimal runtime shape we rely on from maplibre-gl
interface MapLibreModule {
  Map: new (options: unknown) => MapInstance;
  Marker: new (element?: HTMLElement) => MarkerInstance;
}

interface UseMapLibreMapProps {
  container: HTMLDivElement | null;
  center: Location;
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (location: Location) => void;
  clusterMarkers?: boolean;
}

// Singleton promise to ensure we only load the library & CSS once
let mapLibreLoadPromise: Promise<MapLibreModule> | null = null;
function loadMapLibre(): Promise<MapLibreModule> {
  mapLibreLoadPromise ??= import('maplibre-gl').then(async (mod) => {
    // Load CSS side-effect dynamically (ignored in SSR)
    try {
      await import('maplibre-gl/dist/maplibre-gl.css');
    } catch {
      // CSS load failure should not break map usage
    }
    const resolved = (mod.default ?? mod) as unknown;
    return resolved as MapLibreModule;
  });
  return mapLibreLoadPromise;
}

// Helper function to safely cancel idle callback or timeout
function cancelIdleCallbackSafe(idleCallbackId: number | NodeJS.Timeout | null): void {
  if (idleCallbackId === null) return;

  if (typeof idleCallbackId === 'number') {
    const cib = globalThis.cancelIdleCallback;
    if (typeof cib === 'function') {
      cib(idleCallbackId);
    }
  } else {
    clearTimeout(idleCallbackId);
  }
}

export function useMapLibreMap({
  container,
  center,
  zoom = 13,
  markers = [],
  onMarkerClick,
  onMapClick,
  clusterMarkers = true,
}: UseMapLibreMapProps): {
  map: MapInstance | null;
  isLoading: boolean;
  error: Error | null;
} {
  const mapRef = useRef<MapInstance | null>(null);
  const markersRef = useRef<MarkerInstance[]>([]);
  const runtimeLibRef = useRef<MapLibreModule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!container) return;
    let cancelled = false;

    void (async () => {
      try {
        const lib = await loadMapLibre();
        if (isTruthy(cancelled)) return;
        runtimeLibRef.current = lib;
        const map = new lib.Map({
          container,
          style: getMapStyleUrl(),
          center: [center.lng, center.lat],
          zoom,
          maxZoom: 18,
          minZoom: 3,
        });

        map.on('load', () => {
          if (isTruthy(cancelled)) return;
          setIsLoading(false);
          setError(null);
        });

        map.on('error', (e) => {
          if (isTruthy(cancelled)) return;
          const err = e.error instanceof Error ? e.error : new Error(String(e.error));
          setError(err);
          setIsLoading(false);
        });

        mapRef.current = map;
      } catch (err) {
        if (isTruthy(cancelled)) return;
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (isTruthy(mapRef.current)) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [container, center.lat, center.lng, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;

    map.setCenter([center.lng, center.lat]);
    if (zoom !== undefined) {
      map.setZoom(zoom);
    }
  }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const lib = runtimeLibRef.current;
    if (!map || !lib || !map.loaded() || markers.length === 0) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (clusterMarkers && markers.length > 10) {
      const clusters = clusterMarkersByZoom(markers);
      clusters.forEach((cluster) => {
        const el = document.createElement('div');
        el.className = 'cluster-marker';
        el.innerHTML = cluster.count > 1 ? `<div>${String(cluster.count ?? '')}</div>` : '';
        el.style.width = cluster.count > 1 ? '40px' : '30px';
        el.style.height = cluster.count > 1 ? '40px' : '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = cluster.count > 1 ? 'hsl(var(--primary))' : 'hsl(var(--accent))';
        el.style.color = 'white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '12px';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const marker = new lib.Marker(el)
          .setLngLat([cluster.location.lng, cluster.location.lat])
          .addTo(map);

        el.addEventListener('click', () => {
          if (cluster.count === 1 && cluster.markers[0]) {
            onMarkerClick?.(cluster.markers[0]);
          } else {
            map.flyTo({
              center: [cluster.location.lng, cluster.location.lat],
              zoom: Math.min(map.getZoom() + 2, 18),
            });
          }
        });

        markersRef.current.push(marker);
      });
    } else {
      markers.forEach((markerData) => {
        const el = document.createElement('div');
        el.className = 'single-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = markerData.color ?? 'hsl(var(--primary))';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        const marker = new lib.Marker(el)
          .setLngLat([markerData.location.lng, markerData.location.lat])
          .addTo(map);

        el.addEventListener('click', () => {
          onMarkerClick?.(markerData);
        });

        markersRef.current.push(marker);
      });
    }
  }, [markers, clusterMarkers, onMarkerClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded() || !onMapClick) return;

    const handleClick = (e: MapMouseEvent) => {
      onMapClick({
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
      });
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [onMapClick]);

  // Throttled region change handler with requestIdleCallback fallback
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.loaded()) return;

    let pendingRegion: { lat: number; lng: number; zoom: number } | null = null;
    let idleCallbackId: number | NodeJS.Timeout | null = null;

    const handleMoveEnd = (): void => {
      const c = map.getCenter();
      const z = map.getZoom();
      pendingRegion = { lat: c.lat, lng: c.lng, zoom: z };

      cancelIdleCallbackSafe(idleCallbackId);

      const scheduleUpdate = (cb: () => void): void => {
        const ric = globalThis.requestIdleCallback;
        if (typeof ric === 'function') {
          idleCallbackId = ric(cb, { timeout: 120 });
        } else {
          idleCallbackId = setTimeout(cb, 120);
        }
      };

      scheduleUpdate(() => {
        if (isTruthy(pendingRegion)) {
          pendingRegion = null; // Throttled noop placeholder for potential future state sync
        }
        idleCallbackId = null;
      });
    };

    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
      cancelIdleCallbackSafe(idleCallbackId);
    };
  }, []);

  return {
    map: mapRef.current,
    isLoading,
    error,
  };
}

function clusterMarkersByZoom(markers: MapMarker[]): {
  location: Location;
  count: number;
  markers: MapMarker[];
}[] {
  const clusters: {
    location: Location;
    count: number;
    markers: MapMarker[];
  }[] = [];
  const processed = new Set<string>();
  const clusterRadius = 0.01;

  markers.forEach((marker) => {
    if (processed.has(marker.id)) return;

    const nearby = markers.filter((m) => {
      if (processed.has(m.id)) return false;
      const latDiff = Math.abs(m.location.lat - marker.location.lat);
      const lngDiff = Math.abs(m.location.lng - marker.location.lng);
      return latDiff < clusterRadius && lngDiff < clusterRadius;
    });

    if (nearby.length > 1) {
      const clusterCenter: Location = {
        lat: nearby.reduce((sum, m) => sum + m.location.lat, 0) / nearby.length,
        lng: nearby.reduce((sum, m) => sum + m.location.lng, 0) / nearby.length,
      };

      clusters.push({
        location: clusterCenter,
        count: nearby.length,
        markers: nearby,
      });

      nearby.forEach((m) => processed.add(m.id));
    } else {
      clusters.push({
        location: marker.location,
        count: 1,
        markers: [marker],
      });
      processed.add(marker.id);
    }
  });

  return clusters;
}
