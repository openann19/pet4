/**
 * Tests for distance utility
 *
 * Coverage target: >= 95% statements/branches/functions/lines
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseLocation,
  calculateDistance,
  getDistanceBetweenLocations,
  formatDistance,
  getCityCoordinates,
  getCurrentUserLocation,
  getDistanceFilterLabel,
  type Coordinates,
} from '../distance';

describe('distance', () => {
  describe('parseLocation', () => {
    it('should parse comma-separated coordinates', () => {
      const result = parseLocation('40.7128, -74.006');
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it('should parse lat:lng format', () => {
      const result = parseLocation('lat: 40.7128, lng: -74.006');
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it('should parse lat:lon format', () => {
      const result = parseLocation('lat: 40.7128, lon: -74.006');
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it('should return null for invalid coordinates', () => {
      const result = parseLocation('invalid');
      expect(result).toBeNull();
    });

    it('should return null for out-of-range latitude', () => {
      const result = parseLocation('91, -74.006');
      expect(result).toBeNull();
    });

    it('should return null for out-of-range longitude', () => {
      const result = parseLocation('40.7128, -181');
      expect(result).toBeNull();
    });

    it('should parse known city names', () => {
      const result = parseLocation('New York');
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it('should parse city names with state', () => {
      const result = parseLocation('New York, NY');
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      const coords1: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const coords2: Coordinates = { latitude: 34.0522, longitude: -118.2437 };
      const distance = calculateDistance(coords1, coords2);

      expect(distance).toBeGreaterThan(2400);
      expect(distance).toBeLessThan(2500);
    });

    it('should return 0 for same coordinates', () => {
      const coords: Coordinates = { latitude: 40.7128, longitude: -74.006 };
      const distance = calculateDistance(coords, coords);

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const coords1: Coordinates = { latitude: -34.0522, longitude: -118.2437 };
      const coords2: Coordinates = { latitude: -40.7128, longitude: -74.006 };
      const distance = calculateDistance(coords1, coords2);

      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('getDistanceBetweenLocations', () => {
    it('should calculate distance between two location strings', () => {
      const distance = getDistanceBetweenLocations('New York', 'Los Angeles');
      expect(distance).toBeGreaterThan(2400);
      expect(distance).toBeLessThan(2500);
    });

    it('should handle coordinate strings', () => {
      const distance = getDistanceBetweenLocations('40.7128, -74.006', '34.0522, -118.2437');
      expect(distance).toBeGreaterThan(2400);
      expect(distance).toBeLessThan(2500);
    });

    it('should return null for invalid locations', () => {
      const distance = getDistanceBetweenLocations('invalid', 'also invalid');
      expect(distance).toBeNull();
    });

    it('should return null if one location is invalid', () => {
      const distance = getDistanceBetweenLocations('New York', 'invalid');
      expect(distance).toBeNull();
    });
  });

  describe('formatDistance', () => {
    it('should format distance less than 1 mile', () => {
      expect(formatDistance(0.5)).toBe('Less than 1 mile away');
    });

    it('should format exactly 1 mile', () => {
      expect(formatDistance(1)).toBe('1 mile away');
    });

    it('should format distance less than 10 miles with one decimal', () => {
      expect(formatDistance(5.7)).toBe('5.7 miles away');
    });

    it('should format distance 10 or more miles as rounded', () => {
      expect(formatDistance(15.7)).toBe('16 miles away');
      expect(formatDistance(100.3)).toBe('100 miles away');
    });
  });

  describe('getCityCoordinates', () => {
    it('should return coordinates for known city', () => {
      const result = getCityCoordinates('New York');
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it('should handle case-insensitive city names', () => {
      const result = getCityCoordinates('NEW YORK');
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it('should handle city names with state', () => {
      const result = getCityCoordinates('New York, NY');
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it('should return null for unknown city', () => {
      const result = getCityCoordinates('Unknown City');
      expect(result).toBeNull();
    });

    it('should trim whitespace', () => {
      const result = getCityCoordinates('  New York  ');
      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });
  });

  describe('getCurrentUserLocation', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return coordinates when geolocation succeeds', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: vi.fn((success) => {
            success(mockPosition);
          }),
        },
        writable: true,
        configurable: true,
      });

      const result = await getCurrentUserLocation();

      expect(result).toEqual({ latitude: 40.7128, longitude: -74.006 });
    });

    it('should return null when geolocation is not available', async () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await getCurrentUserLocation();

      expect(result).toBeNull();
    });

    it('should return null when geolocation fails', async () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: vi.fn((_success, error) => {
            error(new Error('Permission denied'));
          }),
        },
        writable: true,
        configurable: true,
      });

      const result = await getCurrentUserLocation();

      expect(result).toBeNull();
    });
  });

  describe('getDistanceFilterLabel', () => {
    it('should return "Anywhere" for distances >= 100 miles', () => {
      expect(getDistanceFilterLabel(100)).toBe('Anywhere');
      expect(getDistanceFilterLabel(200)).toBe('Anywhere');
    });

    it('should return formatted label for distances < 100 miles', () => {
      expect(getDistanceFilterLabel(10)).toBe('Within 10 miles');
      expect(getDistanceFilterLabel(50)).toBe('Within 50 miles');
      expect(getDistanceFilterLabel(99)).toBe('Within 99 miles');
    });
  });
});
