import type { Notification, NotificationOptions } from '@mobile/components/notifications'
import { useNotifications } from '@mobile/components/notifications'
import { useCallback } from 'react'

/**
 * Convenience hook for showing notifications
 * Provides typed helper methods for common notification types
 */
export function useNotificationToast(): {
  showSuccess: (title: string, message?: string, options?: Partial<NotificationOptions>) => void
  showError: (title: string, message?: string, options?: Partial<NotificationOptions>) => void
  showWarning: (title: string, message?: string, options?: Partial<NotificationOptions>) => void
  showInfo: (title: string, message?: string, options?: Partial<NotificationOptions>) => void
  showNotification: (notification: Omit<Notification, 'id'>) => void
} {
  const { showNotification } = useNotifications()

  const showSuccess = useCallback(
    (title: string, message?: string, options?: Partial<NotificationOptions>): void => {
      const notification: Omit<Notification, 'id'> = {
        type: 'success',
        title,
        ...(message !== undefined && message !== '' ? { message } : {}),
      }
      if (options) {
        if (options.duration !== undefined) {
          notification.duration = options.duration
        }
        if (options.action) {
          notification.action = options.action
        }
        if (options.icon !== undefined && options.icon !== '') {
          notification.icon = options.icon
        }
      }
      showNotification(notification)
    },
    [showNotification]
  )

  const showError = useCallback(
    (title: string, message?: string, options?: Partial<NotificationOptions>): void => {
      const notification: Omit<Notification, 'id'> = {
        type: 'error',
        title,
        duration: options?.duration ?? 5000,
        ...(message !== undefined && message !== '' ? { message } : {}),
      }
      if (options) {
        if (options.action) {
          notification.action = options.action
        }
        if (options.icon !== undefined && options.icon !== '') {
          notification.icon = options.icon
        }
      }
      showNotification(notification)
    },
    [showNotification]
  )

  const showWarning = useCallback(
    (title: string, message?: string, options?: Partial<NotificationOptions>): void => {
      const notification: Omit<Notification, 'id'> = {
        type: 'warning',
        title,
        ...(message !== undefined && message !== '' ? { message } : {}),
      }
      if (options) {
        if (options.duration !== undefined) {
          notification.duration = options.duration
        }
        if (options.action) {
          notification.action = options.action
        }
        if (options.icon !== undefined && options.icon !== '') {
          notification.icon = options.icon
        }
      }
      showNotification(notification)
    },
    [showNotification]
  )

  const showInfo = useCallback(
    (title: string, message?: string, options?: Partial<NotificationOptions>): void => {
      const notification: Omit<Notification, 'id'> = {
        type: 'info',
        title,
        ...(message !== undefined && message !== '' ? { message } : {}),
      }
      if (options) {
        if (options.duration !== undefined) {
          notification.duration = options.duration
        }
        if (options.action) {
          notification.action = options.action
        }
        if (options.icon !== undefined && options.icon !== '') {
          notification.icon = options.icon
        }
      }
      showNotification(notification)
    },
    [showNotification]
  )

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
  }
}
