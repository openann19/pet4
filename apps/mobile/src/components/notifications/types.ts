/**
 * Notification types and interfaces
 * Location: src/components/notifications/types.ts
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onPress: () => void
  }
  icon?: string
}

export interface NotificationOptions {
  type: NotificationType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onPress: () => void
  }
  icon?: string
}

