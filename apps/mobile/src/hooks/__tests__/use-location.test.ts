/**
 * Location Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-location.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useLocation, calculateDistance, type LocationCoordinates } from '../use-location'
import * as Location from 'expo-location'

// Mock expo-location
vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  watchPositionAsync: vi.fn(),
  Accuracy: {
    Balanced: 'balanced',
    High: 'high',
    Low: 'low',
  },
}))

const mockLocation = vi.mocked(Location)

describe('useLocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requestPermission', () => {
    it('should request permission successfully', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        granted: true,
        canAskAgain: true,
        expires: 'never',
      } as Location.LocationPermissionResponse)

      const { result } = renderHook(() => useLocation())

      let permissionResult: boolean | undefined
      await act(async () => {
        permissionResult = await result.current.requestPermission()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(permissionResult).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should return false when permission is denied', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        granted: false,
        canAskAgain: false,
        expires: 'never',
      } as Location.LocationPermissionResponse)

      const { result } = renderHook(() => useLocation())

      let permissionResult: boolean | undefined
      await act(async () => {
        permissionResult = await result.current.requestPermission()
      })

      expect(permissionResult).toBe(false)
      expect(result.current.error).toBe('Permission to access location was denied')
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to request permission')
      mockLocation.requestForegroundPermissionsAsync.mockRejectedValue(error)

      const { result } = renderHook(() => useLocation())

      let permissionResult: boolean | undefined
      await act(async () => {
        permissionResult = await result.current.requestPermission()
      })

      expect(permissionResult).toBe(false)
      expect(result.current.error).toBeDefined()
    })
  })

  describe('getCurrentLocation', () => {
    it('should get current location successfully', async () => {
      const _mockLocationData = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
        },
        timestamp: Date.now(),
      }

      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        granted: true,
        canAskAgain: true,
        expires: 'never',
      } as Location.LocationPermissionResponse)
      mockLocation.getCurrentPositionAsync.mockResolvedValue({
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          altitude: null,
          altitudeAccuracy: null,
          accuracy: 10,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as Location.LocationObject)

      const { result } = renderHook(() => useLocation())

      let locationResult: LocationCoordinates | null = null
      await act(async () => {
        locationResult = await result.current.getCurrentLocation()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(locationResult).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
      })
      expect(result.current.location).toEqual(locationResult)
    })

    it('should return null when permission is denied', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        granted: false,
        canAskAgain: false,
        expires: 'never',
      } as Location.LocationPermissionResponse)

      const { result } = renderHook(() => useLocation())

      let locationResult: LocationCoordinates | null = null
      await act(async () => {
        locationResult = await result.current.getCurrentLocation()
      })

      expect(locationResult).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to get location')
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        granted: true,
        canAskAgain: true,
        expires: 'never',
      } as Location.LocationPermissionResponse)
      mockLocation.getCurrentPositionAsync.mockRejectedValue(error)

      const { result } = renderHook(() => useLocation())

      let locationResult: LocationCoordinates | null = null
      await act(async () => {
        locationResult = await result.current.getCurrentLocation()
      })

      expect(locationResult).toBeNull()
      expect(result.current.error).toBeDefined()
    })
  })

  describe('watchPosition', () => {
    it('should watch position successfully', async () => {
      const mockSubscription = {
        remove: vi.fn(),
      }

      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        granted: true,
        canAskAgain: true,
        expires: 'never',
      } as Location.LocationPermissionResponse)
      mockLocation.watchPositionAsync.mockResolvedValue(mockSubscription)

      const { result } = renderHook(() => useLocation())

      act(() => {
        result.current.watchPosition()
      })

      await waitFor(() => {
        expect(mockLocation.watchPositionAsync).toHaveBeenCalled()
      })
    })

    it('should not watch when permission is denied', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        granted: false,
        canAskAgain: false,
        expires: 'never',
      } as Location.LocationPermissionResponse)

      const { result } = renderHook(() => useLocation())

      act(() => {
        result.current.watchPosition()
      })

      expect(mockLocation.watchPositionAsync).not.toHaveBeenCalled()
    })
  })

  describe('stopWatching', () => {
    it('should stop watching position', async () => {
      const mockSubscription = {
        remove: vi.fn(),
      }

      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        granted: true,
        canAskAgain: true,
        expires: 'never',
      } as Location.LocationPermissionResponse)
      mockLocation.watchPositionAsync.mockResolvedValue(mockSubscription)

      const { result } = renderHook(() => useLocation())

      act(() => {
        result.current.watchPosition()
      })

      await waitFor(() => {
        expect(mockLocation.watchPositionAsync).toHaveBeenCalled()
      })

      act(() => {
        result.current.stopWatching()
      })

      expect(mockSubscription.remove).toHaveBeenCalled()
    })
  })

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useLocation())

      expect(result.current.location).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(typeof result.current.requestPermission).toBe('function')
      expect(typeof result.current.getCurrentLocation).toBe('function')
      expect(typeof result.current.watchPosition).toBe('function')
      expect(typeof result.current.stopWatching).toBe('function')
    })
  })
})

describe('calculateDistance', () => {
  it('should calculate distance between two coordinates', () => {
    const coord1 = {
      latitude: 40.7128,
      longitude: -74.006,
    }

    const coord2 = {
      latitude: 40.7589,
      longitude: -73.9851,
    }

    const distance = calculateDistance(coord1, coord2)

    expect(typeof distance).toBe('number')
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThan(100) // Should be less than 100 km for these coordinates
  })

  it('should return 0 for same coordinates', () => {
    const coord = {
      latitude: 40.7128,
      longitude: -74.006,
    }

    const distance = calculateDistance(coord, coord)

    expect(distance).toBe(0)
  })
})
