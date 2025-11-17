/**
 * Maps API Mock Utilities
 *
 * Mock utilities for Maps APIs (MapLibre, Leaflet, etc.) in tests
 */

import { vi } from 'vitest';

/**
 * Mock MapLibre Map
 */
export class MockMapLibreMap {
  on = vi.fn();
  off = vi.fn();
  remove = vi.fn();
  getCenter = vi.fn(() => ({ lng: 0, lat: 0 }));
  setCenter = vi.fn();
  getZoom = vi.fn(() => 10);
  setZoom = vi.fn();
  fitBounds = vi.fn();
  addLayer = vi.fn();
  removeLayer = vi.fn();
  addSource = vi.fn();
  removeSource = vi.fn();
  addControl = vi.fn();
  removeControl = vi.fn();
  getBounds = vi.fn(() => ({
    getNorth: () => 1,
    getSouth: () => -1,
    getEast: () => 1,
    getWest: () => -1,
  }));
  queryRenderedFeatures = vi.fn(() => []);
  project = vi.fn((lnglat: { lng: number; lat: number }) => ({ x: 0, y: 0 }));
  unproject = vi.fn((point: { x: number; y: number }) => ({ lng: 0, lat: 0 }));
  flyTo = vi.fn();
  easeTo = vi.fn();
  jumpTo = vi.fn();
  resize = vi.fn();
  loaded = vi.fn(() => Promise.resolve());
  style = {
    loaded: vi.fn(() => Promise.resolve()),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    addSource: vi.fn(),
    removeSource: vi.fn(),
  };
}

/**
 * Mock Leaflet Map
 */
export class MockLeafletMap {
  on = vi.fn();
  off = vi.fn();
  remove = vi.fn();
  getCenter = vi.fn(() => ({ lng: 0, lat: 0 }));
  setView = vi.fn();
  getZoom = vi.fn(() => 10);
  setZoom = vi.fn();
  fitBounds = vi.fn();
  addLayer = vi.fn();
  removeLayer = vi.fn();
  addControl = vi.fn();
  removeControl = vi.fn();
  getBounds = vi.fn(() => ({
    getNorth: () => 1,
    getSouth: () => -1,
    getEast: () => 1,
    getWest: () => -1,
  }));
  eachLayer = vi.fn();
  invalidateSize = vi.fn();
  flyTo = vi.fn();
  panTo = vi.fn();
  zoomIn = vi.fn();
  zoomOut = vi.fn();
}

/**
 * Mock MapLibre
 */
export const mockMapLibre = {
  Map: vi.fn(() => new MockMapLibreMap()),
  Marker: vi.fn(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    setPopup: vi.fn().mockReturnThis(),
  })),
  Popup: vi.fn(() => ({
    setHTML: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  })),
  NavigationControl: vi.fn(),
  GeolocateControl: vi.fn(),
  ScaleControl: vi.fn(),
  FullscreenControl: vi.fn(),
};

/**
 * Mock Leaflet
 */
export const mockLeaflet = {
  map: vi.fn(() => new MockLeafletMap()),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
  })),
  popup: vi.fn(() => ({
    setContent: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    openOn: vi.fn(),
  })),
  circle: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
  })),
  circleMarker: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
  })),
  polygon: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
  })),
  polyline: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
  })),
  latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
  latLngBounds: vi.fn(() => ({
    extend: vi.fn().mockReturnThis(),
    getNorth: () => 1,
    getSouth: () => -1,
    getEast: () => 1,
    getWest: () => -1,
  })),
  icon: vi.fn(() => ({})),
  control: {
    zoom: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
    })),
    scale: vi.fn(() => ({
      addTo: vi.fn().mockReturnThis(),
    })),
  },
};

/**
 * Setup Maps API mocks
 * Note: vi.mock calls must be at top level, so this is a no-op
 * The actual mocks are set up in the test setup file
 */
export function setupMapsMocks(): void {
  // Mocks are set up via vi.mock at top level in setup.ts
  // This function is kept for consistency with other mock setups
}
