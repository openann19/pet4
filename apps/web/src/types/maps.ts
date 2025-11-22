/**
 * Maps Types
 *
 * Shared types for map-related functionality.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationWithDistance extends Coordinates {
  distance?: number;
}
