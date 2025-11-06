/**
 * Mobile NotificationCenter component
 * Uses pure React Native primitives (no web-specific dependencies).
 */

import React, { useMemo, useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'

export type NotificationType = 'match' | 'message' | 'like' | 'comment' | 'playdate' | 'system'

export interface NotificationItem {
  readonly id: string
  readonly type: NotificationType
  readonly title: string
  readonly message: string
  readonly timestamp: number
  readonly read: boolean
}

type Filter = 'all' | 'unread'

const ICON_BY_TYPE: Record<NotificationType, string> = {
  match: '💕',
  message: '💬',
  like: '❤️',
  comment: '💭',
  playdate: '🎾',
  system: '🔔',
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff >= day) {
    return `${Math.floor(diff / day)}d ago`
  }
  if (diff >= hour) {
    return `${Math.floor(diff / hour)}h ago`
  }
  if (diff >= minute) {
    return `${Math.floor(diff / minute)}m ago`
  }
  return 'Just now'
}

export interface NotificationCenterProps {
  readonly items?: NotificationItem[]
  readonly onMarkAsRead?: (id: string) => void
  readonly onClearAll?: () => void
  readonly onDelete?: (id: string) => void
}

export function NotificationCenter({
  items = [],
  onMarkAsRead,
  onClearAll,
  onDelete,
}: NotificationCenterProps): React.JSX.Element {
  const [filter, setFilter] = useState<Filter>('all')

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items])

  const filtered = useMemo(() => {
    if (filter === 'unread') {
      return items.filter((item) => !item.read)
    }
    return items
  }, [filter, items])

  const group = useMemo(() => {
    const now = Date.now()
    const cutoff = 24 * 60 * 60 * 1000
    const today: NotificationItem[] = []
    const earlier: NotificationItem[] = []

    filtered.forEach((item) => {
      if (now - item.timestamp < cutoff) {
        today.push(item)
      } else {
        earlier.push(item)
      }
    })

    return { today, earlier }
  }, [filtered])

  const handleMark = useCallback(
    (id: string) => {
      onMarkAsRead?.(id)
    },
    [onMarkAsRead],
  )

  const handleDelete = useCallback(
    (id: string) => {
      onDelete?.(id)
    },
    [onDelete],
  )

  const handleClearAll = useCallback(() => {
    onClearAll?.()
  }, [onClearAll])

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <Pressable style={styles.headerAction} onPress={() => setFilter('unread')} accessibilityRole="button">
            <Text style={styles.headerActionText}>{unreadCount} unread</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        <FilterChip label={`All (${items.length})`} active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip label={`Unread (${unreadCount})`} active={filter === 'unread'} onPress={() => setFilter('unread')} />
      </View>

      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>Nothing to show yet.</Text>
          </View>
        ) : (
          <View style={styles.sectionList}>
            {group.today.length > 0 && (
              <NotificationSection title="Today" items={group.today} onMark={handleMark} onDelete={handleDelete} />
            )}
            {group.earlier.length > 0 && (
              <NotificationSection title="Earlier" items={group.earlier} onMark={handleMark} onDelete={handleDelete} />
            )}
          </View>
        )}
      </ScrollView>

      {items.length > 0 && (
        <Pressable style={styles.clearButton} onPress={handleClearAll} accessibilityRole="button">
          <Text style={styles.clearButtonText}>Clear all</Text>
        </Pressable>
      )}
    </View>
  )
}

interface NotificationSectionProps {
  readonly title: string
  readonly items: NotificationItem[]
  readonly onMark: (id: string) => void
  readonly onDelete: (id: string) => void
}

function NotificationSection({ title, items, onMark, onDelete }: NotificationSectionProps) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} onMark={onMark} onDelete={onDelete} />
      ))}
    </View>
  )
}

interface NotificationRowProps {
  readonly item: NotificationItem
  readonly onMark: (id: string) => void
  readonly onDelete: (id: string) => void
}

function NotificationRow({ item, onMark, onDelete }: NotificationRowProps) {
  return (
    <View style={[styles.notificationCard, !item.read && styles.notificationCardUnread]}>
      <View style={styles.notificationIconCircle}>
        <Text style={styles.notificationIcon}>{ICON_BY_TYPE[item.type]}</Text>
      </View>
      <View style={styles.notificationBody}>
        <View style={styles.notificationHeaderRow}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {!item.read && (
            <Pressable onPress={() => onMark(item.id)} style={styles.markButton} accessibilityRole="button">
              <Text style={styles.markButtonText}>Mark read</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>{formatRelativeTime(item.timestamp)}</Text>
      </View>
      <Pressable onPress={() => onDelete(item.id)} style={styles.deleteButton} accessibilityRole="button">
        <Text style={styles.deleteButtonText}>✕</Text>
      </Pressable>
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
    color: '#0f172a',
  },
  headerAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  headerActionText: {
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
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
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
  listContainer: {
    maxHeight: 420,
  },
  listContent: {
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
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
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
  notificationCard: {
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
  notificationCardUnread: {
    borderColor: '#c7d2fe',
    backgroundColor: '#eef2ff',
  },
  notificationIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBody: {
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
  notificationTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  markButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
  },
  markButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
  deleteButtonText: {
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
