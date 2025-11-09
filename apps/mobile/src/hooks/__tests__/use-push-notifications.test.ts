/**
 * Push Notifications Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-push-notifications.test.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { usePushNotifications } from '../use-push-notifications'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { createLogger } from '@/utils/logger'

// Mock expo-device
vi.mock('expo-device', () => ({
  isDevice: true,
  modelId: 'iPhone13,2',
}))

// Mock expo-notifications
vi.mock('expo-notifications', () => ({
  setNotificationHandler: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  addNotificationReceivedListener: vi.fn(() => ({ remove: vi.fn() })),
  addNotificationResponseReceivedListener: vi.fn(() => ({ remove: vi.fn() })),
  removeNotificationSubscription: vi.fn(),
  AndroidImportance: {
    MAX: 'max',
  },
}))

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  notificationAsync: vi.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
}))

// Mock Platform
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}))

// Mock environment variable
process.env['EXPO_PUBLIC_PROJECT_ID'] = 'test-project-id'

const mockDevice = vi.mocked(Device)
const mockNotifications = vi.mocked(Notifications)

describe('usePushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDevice.isDevice = true
    Platform.OS = 'ios'
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('registerForPushNotifications', () => {
    it('should register for push notifications successfully', async () => {
      const mockToken = {
        data: 'ExponentPushToken[test-token]',
      }

      mockNotifications.getPermissionsAsync.mockResolvedValue({
        granted: true,
        canAskAgain: true,
        expires: 'never',
      } as Notifications.NotificationPermissionsStatus)
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        ...mockToken,
        type: 'expo',
      } as Notifications.ExpoPushToken)

      const { result } = renderHook(() => usePushNotifications())

      let tokenResult: { token: string; deviceId: string } | null | undefined
      await act(async () => {
        tokenResult = await result.current.registerForPushNotifications()
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(tokenResult).toEqual({
        token: mockToken.data,
        deviceId: 'iPhone13,2',
      })
      expect(result.current.token).toEqual(tokenResult)
      expect(result.current.isRegistered).toBe(true)
    })

    it('should request permissions when not granted', async () => {
      const mockToken = {
        data: 'ExponentPushToken[test-token]',
      }

      mockNotifications.getPermissionsAsync.mockResolvedValue({
        granted: false,
        canAskAgain: true,
        expires: 'never',
      } as Notifications.NotificationPermissionsStatus)
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        granted: true,
        canAskAgain: true,
        expires: 'never',
      } as Notifications.NotificationPermissionsStatus)
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        ...mockToken,
        type: 'expo',
      } as Notifications.ExpoPushToken)

      const { result } = renderHook(() => usePushNotifications())

      let tokenResult: { token: string; deviceId: string } | null | undefined
      await act(async () => {
        tokenResult = await result.current.registerForPushNotifications()
      })

      expect(tokenResult).toBeDefined()
      expect(mockNotifications.requestPermissionsAsync).toHaveBeenCalled()
    })

    it('should return null when not a device', async () => {
      mockDevice.isDevice = false

      const { result } = renderHook(() => usePushNotifications())

      let tokenResult: { token: string; deviceId: string } | null | undefined
      await act(async () => {
        tokenResult = await result.current.registerForPushNotifications()
      })

      expect(tokenResult).toBeNull()
    })

    it('should return null when permission is denied', async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        granted: false,
        canAskAgain: false,
        expires: 'never',
      } as Notifications.NotificationPermissionsStatus)
      mockNotifications.requestPermissionsAsync.mockResolvedValue({
        granted: false,
        canAskAgain: false,
        expires: 'never',
      } as Notifications.NotificationPermissionsStatus)

      const { result } = renderHook(() => usePushNotifications())

      let tokenResult: { token: string; deviceId: string } | null | undefined
      await act(async () => {
        tokenResult = await result.current.registerForPushNotifications()
      })

      expect(tokenResult).toBeNull()
    })

    it('should return null when project ID is not configured', async () => {
      delete process.env['EXPO_PUBLIC_PROJECT_ID']

      mockNotifications.getPermissionsAsync.mockResolvedValue({
        granted: true,
        canAskAgain: true,
        expires: 'never',
      } as Notifications.NotificationPermissionsStatus)

      const { result } = renderHook(() => usePushNotifications())

      let tokenResult: { token: string; deviceId: string } | null | undefined
      await act(async () => {
        tokenResult = await result.current.registerForPushNotifications()
      })

      expect(tokenResult).toBeNull()
      expect(createLogger('usePushNotifications').error).toHaveBeenCalled()
    })

    it('should configure Android channel on Android', async () => {
      Platform.OS = 'android'
      const mockToken = {
        data: 'ExponentPushToken[test-token]',
      }

      mockNotifications.getPermissionsAsync.mockResolvedValue({
        granted: true,
        canAskAgain: true,
        expires: 'never',
      } as Notifications.NotificationPermissionsStatus)
      mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
        ...mockToken,
        type: 'expo',
      } as Notifications.ExpoPushToken)
      mockNotifications.setNotificationChannelAsync.mockResolvedValue(null as Notifications.NotificationChannel | null)

      const { result } = renderHook(() => usePushNotifications())

      await act(async () => {
        await result.current.registerForPushNotifications()
      })

      expect(mockNotifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', {
        name: 'Default',
        importance: 'max',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E89D5C',
      })
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to register')
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        granted: true,
        canAskAgain: true,
        expires: 'never',
      } as Notifications.NotificationPermissionsStatus)
      mockNotifications.getExpoPushTokenAsync.mockRejectedValue(error)

      const { result } = renderHook(() => usePushNotifications())

      let tokenResult: { token: string; deviceId: string } | null | undefined
      await act(async () => {
        tokenResult = await result.current.registerForPushNotifications()
      })

      expect(tokenResult).toBeNull()
      expect(createLogger('usePushNotifications').error).toHaveBeenCalled()
    })
  })

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePushNotifications())

      expect(result.current.token).toBeNull()
      expect(result.current.isRegistered).toBe(false)
      expect(result.current.isLoading).toBe(false)
      expect(typeof result.current.registerForPushNotifications).toBe('function')
    })
  })

  describe('notification listeners', () => {
    it('should setup notification listeners on mount', () => {
      renderHook(() => usePushNotifications())

      expect(mockNotifications.addNotificationReceivedListener).toHaveBeenCalled()
      expect(mockNotifications.addNotificationResponseReceivedListener).toHaveBeenCalled()
    })

    it('should cleanup notification listeners on unmount', () => {
      const removeNotification = vi.fn()
      const removeResponse = vi.fn()

      mockNotifications.addNotificationReceivedListener.mockReturnValue({
        remove: removeNotification,
      })
      mockNotifications.addNotificationResponseReceivedListener.mockReturnValue({
        remove: removeResponse,
      })

      const { unmount } = renderHook(() => usePushNotifications())

      unmount()

      expect(mockNotifications.removeNotificationSubscription).toHaveBeenCalled()
    })
  })
})
