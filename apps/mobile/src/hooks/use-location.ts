/**
 * Location services hook
 * Location: src/hooks/use-location.ts
 */

import type { LocationAccuracy, LocationObject } from 'expo-location'
import * as Location from 'expo-location'
import { useCallback, useEffect, useState } from 'react'
import { isTruthy, isDefined } from '@/core/guards';

export interface LocationCoordinates {
  latitude: number
  longitude: number
  accuracy?: number | undefined
}

export interface UseLocationReturn {
  location: LocationCoordinates | null
  error: string | null
  isLoading: boolean
  requestPermission: () => Promise<boolean>
  getCurrentLocation: () => Promise<LocationCoordinates | null>
  watchPosition: () => void
  stopWatching: () => void
}

export function useLocation(
  accuracy: LocationAccuracy = Location.Accuracy.Balanced
): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoordinates | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [watchSubscription, setWatchSubscription] =
    useState<Location.LocationSubscription | null>(null)

  const requestPermission = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        setError('Permission to access location was denied')
        return false
      }

      setError(null)
      return true
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to request location permission'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
    try {
      setIsLoading(true)
      setError(null)

      const hasPermission = await requestPermission()
      if (!hasPermission) {
        return null
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy,
      })

      const coordinates: LocationCoordinates = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy ?? undefined,
      }

      setLocation(coordinates)
      return coordinates
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to get current location'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const watchPosition = (): void => {
    void requestPermission().then((hasPermission) => {
      if (!hasPermission) {
        return
      }

      const subscription = Location.watchPositionAsync(
        {
          accuracy,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation: LocationObject) => {
          setLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy ?? undefined,
          })
        }
      )

      void subscription.then((sub: Location.LocationSubscription) => {
        setWatchSubscription(sub)
      })
    })
  }

  const stopWatching = useCallback((): void => {
    if (isTruthy(watchSubscription)) {
      watchSubscription.remove()
      setWatchSubscription(null)
    }
  }, [watchSubscription])

  useEffect(() => {
    return () => {
      stopWatching()
    }
  }, [stopWatching])

  return {
    location,
    error,
    isLoading,
    requestPermission,
    getCurrentLocation,
    watchPosition,
    stopWatching,
  }
}

/**
 * Calculate distance between two coordinates (in kilometers)
 */
export function calculateDistance(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(coord2.latitude - coord1.latitude)
  const dLon = toRad(coord2.longitude - coord1.longitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180
}

