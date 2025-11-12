/**
 * Map Screen with Kalman Smoothing
 *
 * Example implementation showing how to use Kalman filter for smooth GPS updates.
 *
 * Location: apps/mobile/src/utils/map-kalman.ts
 */

import { makeKalman } from '@petspark/shared'
import { useRef } from 'react'

/**
 * Example hook for using Kalman filter in map region updates
 *
 * This should be integrated into your existing MapScreen component.
 *
 * @example
 * ```typescript
 * const smooth = useRef(makeKalman()).current
 *
 * const onRegionChange = (region: Region) => {
 *   const smoothed = smooth(region.latitude, region.longitude)
 *   setRegion({ ...region, latitude: smoothed.lat, longitude: smoothed.lng })
 * }
 * ```
 */
export function useKalmanSmoothing() {
  const smooth = useRef(makeKalman({ q: 0.00003, r: 0.0005 })).current

  return (lat: number, lng: number): { lat: number; lng: number } => {
    return smooth(lat, lng)
  }
}

/**
 * Example usage in component:
 * 
 * ```typescript
 * const smoothLocation = useKalmanSmoothing()
 * 
 * useEffect(() => {
 *   const watchId = Geolocation.watchPosition(
 *     (position) => {
 *       const { latitude, longitude } = position.coords
 *       const smoothed = smoothLocation(latitude, longitude)
 *       setRegion({
 *         latitude: smoothed.lat,
 *         longitude: smoothed.lng,
 *         latitudeDelta: 0.01,
 *         longitudeDelta: 0.01,
 *       })
 *     },
 *     (error) => {
      // Geolocation watch error handling
      // Error logging should be handled by caller
    },
 *     { enableHighAccuracy: true }
 *   )
 * 
 *   return () => Geolocation.clearWatch(watchId)
 * }, [])
 * ```
 */
