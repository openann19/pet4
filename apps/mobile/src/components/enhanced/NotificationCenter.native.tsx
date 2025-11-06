/**
 * Mobile NotificationCenter component
 * Location: apps/mobile/src/components/enhanced/NotificationCenter.native.tsx
 */

import React, { useMemo, useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'

export type NotificationType = 'match' | 'message' | 'like' | 'comment' | 'playdate' | 'system'

export interface Notification {
  readonly id: string
  readonly type: NotificationType
  readonly title: string
  readonly message: string
  readonly timestamp: number
  readonly read: boolean
}

type Filter = 'all' | 'unread'

type NotificationSection = {
  readonly title: string
  readonly data: Notification[]
}

const ICON_BY_TYPE: Record<NotificationType, string> = {
  match: '💕',
  message: '💬',
  like: '❤️',
  comment: '💭',
  playdate: '🎾',
  system: '🔔',
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function formatRelative(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff >= ONE_DAY_MS) {
    const days = Math.floor(diff / ONE_DAY_MS)
    return `${days}d ago`
  }

  const hours = Math.floor(diff / (60 * 60 * 1000))
  if (hours > 0) {
    return `${hours}h ago`
  }

  const minutes = Math.floor(diff / (60 * 1000))
  if (minutes > 0) {
    return `${minutes}m ago`
  }

  return 'Just now'
}

export function NotificationCenter(): React.JSX.Element {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  )

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((notification) => !notification.read)
    }
    return notifications
  }, [filter, notifications])

  const sections = useMemo<NotificationSection[]>(() => {
    const now = Date.now()
    const today: Notification[] = []
    const earlier: Notification[] = []

    filteredNotifications.forEach((notification) => {
      if (now - notification.timestamp < ONE_DAY_MS) {
        today.push(notification)
      } else {
        earlier.push(notification)
      }
    })

    const result: NotificationSection[] = []
    if (today.length > 0) {
      result.push({ title: 'Today', data: today })
    }
    if (earlier.length > 0) {
      result.push({ title: 'Earlier', data: earlier })
    }
    return result
  }, [filteredNotifications])

  const markAsRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <View style={styles.wrapper}>
      <Header unreadCount={unreadCount} onMarkAll={markAllAsRead} />

      <View style={styles.filterRow}>
        <FilterChip
          label={`All (${notifications.length})`}
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterChip
          label={`Unread (${unreadCount})`}
          active={filter === 'unread'}
          onPress={() => setFilter('unread')}
        />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {filteredNotifications.length === 0 ? (
          <EmptyState />
        ) : (
          sections.map((section) => (
            <View key={section.title} style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.data.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {notifications.length > 0 && (
        <Pressable style={styles.clearButton} onPress={clearAll} accessibilityRole="button">
          <Text style={styles.clearButtonText}>Clear all</Text>
        </Pressable>
      )}
    </View>
  )
}

function Header({ unreadCount, onMarkAll }: { unreadCount: number; onMarkAll: () => void }) {
  return (
    <View style={styles.headerRow}>
      <Text style={styles.headerTitle}>Notifications</Text>
      {unreadCount > 0 && (
        <Pressable style={styles.markAllButton} onPress={onMarkAll} accessibilityRole="button">
          <Text style={styles.markAllText}>Mark all read</Text>
        </Pressable>
      )}
    </View>
  )
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
      accessibilityRole="button"
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  )
}

function NotificationRow({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const icon = ICON_BY_TYPE[notification.type]

  return (
    <View style={[styles.notificationRow, !notification.read && styles.notificationRowUnread]}>
      <View style={styles.iconPill}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeaderRow}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          {!notification.read && (
            <Pressable
              onPress={() => onMarkRead(notification.id)}
              style={styles.notificationAction}
              accessibilityRole="button"
            >
              <Text style={styles.notificationActionText}>Mark read</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.notificationTimestamp}>{formatRelative(notification.timestamp)}</Text>
      </View>
      <Pressable
        onPress={() => onDelete(notification.id)}
        style={styles.deleteButton}
        accessibilityRole="button"
      >
        <Text style={styles.deleteText}>✕</Text>
      </Pressable>
    </View>
  )
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🔔</Text>
      <Text style={styles.emptyStateText}>You’re all caught up</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338ca',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  scrollContainer: {
    maxHeight: 420,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateIcon: {
    fontSize: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  sectionList: {
    gap: 24,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationRowUnread: {
    borderColor: '#c7d2fe',
    backgroundColor: '#eef2ff',
  },
  iconPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe',
  },
  iconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
    gap: 6,
  },
  notificationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#4b5563',
  },
  notificationTimestamp: {
    fontSize: 11,
    color: '#9ca3af',
  },
  notificationAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
  },
  notificationActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
  deleteText: {
    fontSize: 14,
    color: '#6b7280',
  },
  clearButton: {
    margin: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338ca',
  },
})
