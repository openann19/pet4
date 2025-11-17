/**
 * Push notifications setup and management
 * Location: src/hooks/use-push-notifications.ts
 */

import * as Device from 'expo-device'
import * as Haptics from 'expo-haptics'
import * as Notifications from 'expo-notifications'
import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { createLogger } from '../utils/logger'
import { isTruthy } from '@petspark/shared';

const logger = createLogger('usePushNotifications')

Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => {
    const behavior = {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }
    await Promise.resolve()
    return behavior
  },
})

export interface PushNotificationToken {
  token: string
  deviceId: string
}

export interface UsePushNotificationsReturn {
  token: PushNotificationToken | null
  registerForPushNotifications: () => Promise<PushNotificationToken | null>
  isRegistered: boolean
  isLoading: boolean
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [token, setToken] = useState<PushNotificationToken | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const notificationListener = useRef<Notifications.Subscription>()
  const responseListener = useRef<Notifications.Subscription>()

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification: Notifications.Notification) => {
        // Trigger haptic feedback
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
    )

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response: Notifications.NotificationResponse) => {
        // Handle notification tap
        // Navigate to appropriate screen based on notification data
        // This would be handled by your navigation system
      }
    )

    return () => {
      if (isTruthy(notificationListener.current)) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
      if (isTruthy(responseListener.current)) {
        Notifications.removeNotificationSubscription(responseListener.current)
      }
    }
  }, [])

  const registerForPushNotifications = async (): Promise<PushNotificationToken | null> => {
    setIsLoading(true)

    try {
      if (!Device.isDevice) {
        return null
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        return null
      }

      const projectId = process.env['EXPO_PUBLIC_PROJECT_ID']
      if (!projectId) {
        logger.error('EXPO_PUBLIC_PROJECT_ID not configured')
        return null
      }

      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })

      const deviceId = Device.modelId || 'unknown'

      const pushToken: PushNotificationToken = {
        token: expoPushToken.data,
        deviceId,
      }

      setToken(pushToken)

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E89D5C',
        })
      }

      return pushToken
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to register for push notifications', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    token,
    registerForPushNotifications,
    isRegistered: token !== null,
    isLoading,
  }
}

/**
 * Send local notification
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const content: Notifications.NotificationContentInput = {
    title,
    body,
    sound: true,
    ...(data !== undefined ? { data } : {}),
  }
  await Notifications.scheduleNotificationAsync({
    content,
    trigger: null, // Send immediately
  })
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

/**
 * Get badge count
 */
export function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync()
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count)
}
