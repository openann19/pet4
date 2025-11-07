/**
 * Notification Actions Hook
 * 
 * Handles notification actions like mark as read, archive, delete
 */

import { useCallback } from 'react'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'
import type { PremiumNotification } from '../types'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('useNotificationActions')

export interface UseNotificationActionsOptions {
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  enableHaptics?: boolean
}

export interface UseNotificationActionsReturn {
  handleMarkAsRead: (id: string) => void
  handleMarkAllAsRead: () => void
  handleArchive: (id: string) => void
  handleDelete: (id: string) => void
  handleNotificationClick: (notification: PremiumNotification) => void
}

export function useNotificationActions(options: UseNotificationActionsOptions): UseNotificationActionsReturn {
  const {
    onMarkAsRead,
    onMarkAllAsRead,
    onArchive,
    onDelete,
    enableHaptics = true
  } = options

  const handleMarkAsRead = useCallback((id: string) => {
    if (isTruthy(enableHaptics)) {
      haptics.impact('light')
    }
    onMarkAsRead(id)
    logger.debug('Notification marked as read', { id })
  }, [onMarkAsRead, enableHaptics])

  const handleMarkAllAsRead = useCallback(() => {
    if (isTruthy(enableHaptics)) {
      haptics.impact('medium')
    }
    onMarkAllAsRead()
    logger.debug('All notifications marked as read')
  }, [onMarkAllAsRead, enableHaptics])

  const handleArchive = useCallback((id: string) => {
    if (isTruthy(enableHaptics)) {
      haptics.impact('light')
    }
    onArchive(id)
    logger.debug('Notification archived', { id })
  }, [onArchive, enableHaptics])

  const handleDelete = useCallback((id: string) => {
    if (isTruthy(enableHaptics)) {
      haptics.impact('medium')
    }
    onDelete(id)
    logger.debug('Notification deleted', { id })
  }, [onDelete, enableHaptics])

  const handleNotificationClick = useCallback((notification: PremiumNotification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    if (isTruthy(notification.actionUrl)) {
      // Navigate to action URL
      window.location.href = notification.actionUrl
    }
  }, [handleMarkAsRead])

  return {
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleArchive,
    handleDelete,
    handleNotificationClick
  }
}
