import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedCard } from '../components/AnimatedCard';
import { FadeInView } from '../components/FadeInView';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useStorage } from '../hooks/useStorage';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'mention' | 'follow' | 'match';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  postId?: string;
  userId?: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [storedNotifications, setStoredNotifications] = useStorage<Notification[]>(
    'notifications',
    []
  );

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    // In production, this would fetch from an API
    // For now, use sample data
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        type: 'like',
        title: '❤️ New Like',
        message: 'Sarah liked your post about Max',
        timestamp: Date.now() - 300000, // 5 min ago
        read: false,
      },
      {
        id: '2',
        type: 'comment',
        title: '💬 New Comment',
        message: 'John commented: "Beautiful dog!"',
        timestamp: Date.now() - 3600000, // 1 hour ago
        read: false,
      },
      {
        id: '3',
        type: 'match',
        title: '💝 New Match',
        message: 'You matched with Buddy!',
        timestamp: Date.now() - 7200000, // 2 hours ago
        read: true,
      },
      {
        id: '4',
        type: 'follow',
        title: '👤 New Follower',
        message: 'Emma started following you',
        timestamp: Date.now() - 86400000, // 1 day ago
        read: true,
      },
      {
        id: '5',
        type: 'mention',
        title: '@ Mention',
        message: 'Mike mentioned you in a comment',
        timestamp: Date.now() - 172800000, // 2 days ago
        read: true,
      },
    ];

    // Merge with stored notifications
    const merged = [
      ...sampleNotifications,
      ...storedNotifications.filter(
        (sn) => !sampleNotifications.find((n) => n.id === sn.id)
      ),
    ].sort((a, b) => b.timestamp - a.timestamp);

    setNotifications(merged);
    setLoading(false);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setStoredNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    setStoredNotifications(updated);
  };

  const clearAll = () => {
    setNotifications([]);
    setStoredNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === 'all' ? true : !n.read
  );

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'mention':
        return '@';
      case 'follow':
        return '👤';
      case 'match':
        return '💝';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔔 Notifications</Text>
        </View>
        <View style={styles.content}>
          <LoadingSkeleton height={80} />
          <LoadingSkeleton height={80} style={{ marginTop: 12 }} />
          <LoadingSkeleton height={80} style={{ marginTop: 12 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Notifications</Text>
        {notifications.some((n) => !n.read) && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FadeInView delay={100}>
        <View style={styles.filterBar}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'all' && styles.filterTextActive,
              ]}
            >
              All ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('unread')}
            style={[
              styles.filterButton,
              filter === 'unread' && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === 'unread' && styles.filterTextActive,
              ]}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </Text>
          </TouchableOpacity>
        </View>
      </FadeInView>

      <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
        {filteredNotifications.map((notification, index) => (
          <FadeInView key={notification.id} delay={200 + index * 50}>
            <TouchableOpacity
              onPress={() => markAsRead(notification.id)}
              activeOpacity={0.7}
            >
              <AnimatedCard
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread,
                ]}
              >
                <View style={styles.notificationIcon}>
                  <Text style={styles.notificationEmoji}>
                    {getNotificationIcon(notification.type)}
                  </Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatTime(notification.timestamp)}
                  </Text>
                </View>
              </AnimatedCard>
            </TouchableOpacity>
          </FadeInView>
        ))}

        {filteredNotifications.length === 0 && (
          <FadeInView delay={200}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </Text>
              <Text style={styles.emptyText}>
                {filter === 'unread'
                  ? 'You have no unread notifications'
                  : 'Check back later for updates'}
              </Text>
            </View>
          </FadeInView>
        )}

        {notifications.length > 0 && (
          <FadeInView delay={400}>
            <View style={styles.clearSection}>
              <AnimatedButton onPress={clearAll} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear All Notifications</Text>
              </AnimatedButton>
            </View>
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  markAllRead: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  notificationEmoji: {
    fontSize: 24,
  },
  unreadDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  clearSection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
