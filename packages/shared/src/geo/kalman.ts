/**
 * Kalman Filter for GPS Smoothing
 *
 * Provides smooth position updates by filtering noisy GPS coordinates.
 * Useful for map markers and location tracking.
 *
 * Location: packages/shared/src/geo/kalman.ts
 */

export interface KalmanFilter {
  (lat: number, lng: number): { lat: number; lng: number }
}

export interface KalmanConfig {
  q?: number // Process noise covariance
  r?: number // Measurement noise covariance
}

/**
 * Create a Kalman filter instance for smoothing GPS coordinates
 *
 * @param config - Filter configuration
 * @returns Filter function that takes lat/lng and returns smoothed coordinates
 *
 * @example
 * ```typescript
 * const smooth = makeKalman({ q: 0.00003, r: 0.0005 })
 * const smoothed = smooth(37.7749, -122.4194)
 * ```
 */
export function makeKalman(config: KalmanConfig = {}): KalmanFilter {
  const { q = 0.00003, r = 0.0005 } = config

  let x = 0 // Latitude estimate
  let y = 0 // Longitude estimate
  let p = 1 // Error covariance
  let k = 0 // Kalman gain
  let init = false

  return (lat: number, lng: number): { lat: number; lng: number } => {
    if (!init) {
      x = lat
      y = lng
      init = true
      return { lat: x, lng: y }
    }

    // Prediction step
    p = p + q

    // Update step
    k = p / (p + r)
    x = x + k * (lat - x)
    y = y + k * (lng - y)
    p = (1 - k) * p

    return { lat: x, lng: y }
  }
}
