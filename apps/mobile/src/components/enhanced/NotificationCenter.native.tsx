import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native'
import { MotionView } from '@petspark/motion'
import { Bell, X, Check, CheckCircle } from '@phosphor-icons/react'

export interface Notification {
  id: string
  type: 'match' | 'message' | 'like' | 'comment' | 'playdate' | 'system'
  title: string
  message: string
  timestamp: number
  read: boolean
  actionUrl?: string
  imageUrl?: string
  priority?: 'low' | 'normal' | 'high'
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = (notifications || []).filter(n => !n.read).length

  const filteredNotifications = filter === 'unread'
    ? (notifications || []).filter(n => !n.read)
    : (notifications || [])

  const groupedNotifications = {
    today: (filteredNotifications || []).filter(n =>
      Date.now() - n.timestamp < 24 * 60 * 60 * 1000
    ),
    earlier: (filteredNotifications || []).filter(n =>
      Date.now() - n.timestamp >= 24 * 60 * 60 * 1000
    )
  }

  const markAsRead = (id: string) => {
    setNotifications(current =>
      (current || []).map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(current =>
      (current || []).map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(current =>
      (current || []).filter(n => n.id !== id)
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable
            onPress={markAllAsRead}
            style={styles.markAllButton}
          >
            <CheckCircle size={16} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.filterTabs}>
        <Pressable
          style={[styles.tab, filter === 'all' && styles.activeTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.tabText, filter === 'all' && styles.activeTabText]}>
            All ({(notifications || []).length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, filter === 'unread' && styles.activeTab]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.tabText, filter === 'unread' && styles.activeTabText]}>
            Unread ({unreadCount})
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollArea}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="rgba(0, 0, 0, 0.3)" />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {groupedNotifications.today.length > 0 && (
              <View>
                <Text style={styles.sectionHeader}>Today</Text>
                {groupedNotifications.today.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </View>
            )}

            {groupedNotifications.earlier.length > 0 && (
              <View>
                <Text style={styles.sectionHeader}>Earlier</Text>
                {groupedNotifications.earlier.map((notification, index) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={groupedNotifications.today.length + index}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {(notifications || []).length > 0 && (
        <View style={styles.footer}>
          <Pressable
            onPress={clearAll}
            style={styles.clearButton}
          >
            <Text style={styles.clearText}>Clear all notifications</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  index: _index
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  index: number
}) {
  return (
    <MotionView
      style={styles.notificationItem}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationIcon}>
          {notification.imageUrl ? (
            <Image
              source={{ uri: notification.imageUrl }}
              style={styles.notificationImage}
            />
          ) : (
            <View style={styles.notificationIconBg}>
              <Text style={styles.notificationEmoji}>
                {getNotificationIcon(notification.type)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.notificationText}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTime(notification.timestamp)}
          </Text>
        </View>
      </View>

      <View style={styles.notificationActions}>
        {!notification.read && (
          <Pressable
            style={styles.actionButton}
            onPress={() => onMarkAsRead(notification.id)}
          >
            <Check size={14} color="#6b7280" />
          </Pressable>
        )}
        <Pressable
          style={styles.actionButton}
          onPress={() => onDelete(notification.id)}
        >
          <X size={14} color="#6b7280" />
        </Pressable>
      </View>
    </MotionView>
  )
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

function getNotificationIcon(type: Notification['type']) {
  const iconMap = {
    match: '💕',
    message: '💬',
    like: '❤️',
    comment: '💭',
    playdate: '🎾',
    system: '🔔'
  }
  return iconMap[type] || '🔔'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 12,
    color: '#6b7280',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  scrollArea: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  notificationsList: {
    padding: 16,
    gap: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    paddingLeft: 16,
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationContent: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
  },
  notificationImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationEmoji: {
    fontSize: 20,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notificationActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearButton: {
    width: '100%',
  },
  clearText: {
    fontSize: 12,
    color: '#6b7280',
  },
})
