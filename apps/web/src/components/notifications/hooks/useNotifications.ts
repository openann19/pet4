/**
 * Notifications Data Hook
 *
 * Manages notification data, filtering, and grouping
 */

import { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type {
  PremiumNotification,
  NotificationGroup,
  NotificationFilter,
  NotificationPreferences,
} from '../types';
import { createLogger } from '@/lib/logger';

const _logger = createLogger('useNotifications');

export interface UseNotificationsOptions {
  preferences: NotificationPreferences | null;
  view: 'grouped' | 'list';
  filter: NotificationFilter;
  selectedCategory: string;
}

export interface UseNotificationsReturn {
  notifications: PremiumNotification[];
  filteredNotifications: PremiumNotification[];
  groupedNotifications: NotificationGroup[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archive: (id: string) => void;
  archiveGroup: (groupId: string) => void;
  deleteNotification: (id: string) => void;
  deleteGroup: (groupId: string) => void;
}

export function useNotifications(options: UseNotificationsOptions): UseNotificationsReturn {
  const { preferences, view, filter, selectedCategory } = options;

  const [notifications, setNotifications] = useLocalStorage<PremiumNotification[]>(
    'premium-notifications',
    []
  );

  const allNotifications = useMemo(() => notifications ?? [], [notifications]);

  const filteredNotifications = useMemo(() => {
    return allNotifications
      .filter((n: PremiumNotification) => {
        if (filter === 'archived') return n.archived;
        if (filter === 'unread') return !n.read && !n.archived;
        return !n.archived;
      })
      .filter((n: PremiumNotification) => selectedCategory === 'all' || n.type === selectedCategory)
      .sort((a: PremiumNotification, b: PremiumNotification) => b.timestamp - a.timestamp);
  }, [allNotifications, filter, selectedCategory]);

  const groupedNotifications = useMemo(() => {
    if (!preferences?.groupSimilar || view === 'list') {
      return [];
    }

    const groups = new Map<string, PremiumNotification[]>();

    filteredNotifications.forEach((notification: PremiumNotification) => {
      const groupKey =
        notification.groupId ??
        `${notification.type}-${notification.metadata?.userName ?? notification.metadata?.petName ?? 'solo'}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(notification);
    });

    const notificationGroups: NotificationGroup[] = Array.from(groups.entries()).map(
      ([id, notifs]) => {
        const latest = notifs[0]!;
        const allRead = notifs.every((n) => n.read);

        return {
          id,
          type: latest.type,
          notifications: notifs,
          title: latest.title,
          summary: notifs.length > 1 ? `${notifs.length} notifications` : latest.message,
          timestamp: latest.timestamp,
          read: allRead,
        };
      }
    );

    return notificationGroups.sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredNotifications, preferences, view]);

  const unreadCount = useMemo(
    () => allNotifications.filter((n: PremiumNotification) => !n.read && !n.archived).length,
    [allNotifications]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev: PremiumNotification[]) =>
        (prev ?? []).map((n: PremiumNotification) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [setNotifications]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev: PremiumNotification[]) =>
      (prev ?? []).map((n: PremiumNotification) => (n.archived ? n : { ...n, read: true }))
    );
  }, [setNotifications]);

  const archive = useCallback(
    (id: string) => {
      setNotifications((prev: PremiumNotification[]) =>
        (prev ?? []).map((n: PremiumNotification) =>
          n.id === id ? { ...n, archived: true, read: true } : n
        )
      );
    },
    [setNotifications]
  );

  const archiveGroup = useCallback(
    (groupId: string) => {
      setNotifications((prev: PremiumNotification[]) =>
        (prev ?? []).map((n: PremiumNotification) => {
          const groupKey =
            n.groupId ?? `${n.type}-${n.metadata?.userName ?? n.metadata?.petName ?? 'solo'}`;
          return groupKey === groupId ? { ...n, archived: true, read: true } : n;
        })
      );
    },
    [setNotifications]
  );

  const deleteNotification = useCallback(
    (id: string) => {
      setNotifications((prev: PremiumNotification[]) =>
        (prev ?? []).filter((n: PremiumNotification) => n.id !== id)
      );
    },
    [setNotifications]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      setNotifications((prev: PremiumNotification[]) =>
        (prev ?? []).filter((n: PremiumNotification) => {
          const groupKey =
            n.groupId ?? `${n.type}-${n.metadata?.userName ?? n.metadata?.petName ?? 'solo'}`;
          return groupKey !== groupId;
        })
      );
    },
    [setNotifications]
  );

  return {
    notifications: allNotifications,
    filteredNotifications,
    groupedNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archive,
    archiveGroup,
    deleteNotification,
    deleteGroup,
  };
}
