/**
 * Notification Provider Component
 *
 * Provides notification context and UI for displaying toast notifications.
 * Also configures notification categories for push notifications.
 *
 * Location: apps/mobile/src/components/notifications/NotificationProvider.tsx
 */

import * as Notifications from 'expo-notifications'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createLogger } from '../../utils/logger'
import { NotificationToast } from './NotificationToast'
import type { Notification } from './types'

const logger = createLogger('NotificationProvider')

interface NotificationContextValue {
  showNotification: (notification: Omit<Notification, 'id'>) => void
  dismissNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
  maxNotifications?: number
}

/**
 * Configure notification categories with action buttons
 */
async function configureNotificationCategories(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync('CHAT', [
      {
        identifier: 'REPLY',
        buttonTitle: 'Reply',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'LIKE',
        buttonTitle: '❤️',
        options: {
          opensAppToForeground: false,
        },
      },
    ])

    await Notifications.setNotificationCategoryAsync('MATCH', [
      {
        identifier: 'VIEW',
        buttonTitle: 'View',
        options: {
          opensAppToForeground: true,
        },
      },
    ])

    logger.info('Notification categories configured')
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to configure notification categories', err)
  }
}

export function NotificationProvider({
  children,
  maxNotifications = 3,
}: NotificationProviderProps): React.ReactElement {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    configureNotificationCategories().catch(error => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to setup notification categories', err)
    })
  }, [])

  const dismissNotification = useCallback((id: string): void => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const showNotification = useCallback(
    (notification: Omit<Notification, 'id'>): void => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration ?? 4000,
      }

      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, maxNotifications)
        return updated
      })

      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          dismissNotification(id)
        }, newNotification.duration)
      }
    },
    [maxNotifications, dismissNotification]
  )

  const clearAll = useCallback((): void => {
    setNotifications([])
  }, [])

  const value = useMemo(
    () => ({
      showNotification,
      dismissNotification,
      clearAll,
    }),
    [showNotification, dismissNotification, clearAll]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={() => {
            dismissNotification(notification.id)
          }}
        />
      ))}
    </NotificationContext.Provider>
  )
}
