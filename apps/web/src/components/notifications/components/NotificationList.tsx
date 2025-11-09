/**
 * Notification List Component
 *
 * Displays list of notifications
 */

import { useMemo, useCallback } from 'react';
import { isToday, isYesterday, isSameWeek, formatDistanceToNow } from 'date-fns';
import type { PremiumNotification, NotificationPreferences, NotificationFilter } from '../types';
import {
  NotificationItem,
  type GetIconFunction,
  type GetPriorityStylesFunction,
} from './NotificationItem';
import { EmptyState } from './EmptyState';
import { VirtualList } from '@/components/virtual/VirtualList';

export interface NotificationListProps {
  notifications: PremiumNotification[];
  filter: NotificationFilter;
  preferences: NotificationPreferences | null;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: GetIconFunction;
  getPriorityStyles: GetPriorityStylesFunction;
}

export function NotificationList({
  notifications,
  filter,
  preferences,
  onMarkAsRead,
  onArchive,
  onDelete,
  getIcon,
  getPriorityStyles,
}: NotificationListProps): JSX.Element {
  const groupedByTime = useMemo(() => {
    const groups = new Map<string, PremiumNotification[]>();

    notifications.forEach((notification) => {
      const date = new Date(notification.timestamp);
      let timeGroup: string;

      if (isToday(date)) {
        timeGroup = 'Today';
      } else if (isYesterday(date)) {
        timeGroup = 'Yesterday';
      } else if (isSameWeek(date, new Date())) {
        timeGroup = 'This Week';
      } else {
        timeGroup = formatDistanceToNow(date, { addSuffix: false });
      }

      if (!groups.has(timeGroup)) {
        groups.set(timeGroup, []);
      }
      const notificationList = groups.get(timeGroup);
      if (notificationList) {
        notificationList.push(notification);
      }
    });

    return Array.from(groups.entries());
  }, [notifications]);

  // Flatten for virtualization when list is long
  const flattenedItems = useMemo(() => {
    if (notifications.length <= 20) {
      return null; // Don't virtualize short lists
    }

    const flat: Array<{ type: 'header' | 'notification'; key: string; data: string | PremiumNotification }> = [];
    groupedByTime.forEach(([timeGroup, notifs]) => {
      flat.push({ type: 'header', key: `header-${timeGroup}`, data: timeGroup });
      notifs.forEach((notification) => {
        flat.push({ type: 'notification', key: notification.id, data: notification });
      });
    });
    return flat;
  }, [groupedByTime, notifications.length]);

  const renderItem = useCallback((item: NonNullable<typeof flattenedItems>[0]) => {
    if (item.type === 'header') {
      return (
        <div className="px-2 py-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {item.data as string}
          </h3>
        </div>
      );
    }

    const notification = item.data as PremiumNotification;
    return (
      <div className="px-2">
        <NotificationItem
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onArchive={onArchive}
          onDelete={onDelete}
          getIcon={getIcon}
          getPriorityStyles={getPriorityStyles}
          preferences={preferences}
        />
      </div>
    );
  }, [onMarkAsRead, onArchive, onDelete, getIcon, getPriorityStyles, preferences]);

  const estimateSize = useCallback((index: number) => {
    if (!flattenedItems) return 80;
    const item = flattenedItems[index];
    return item?.type === 'header' ? 40 : 80;
  }, [flattenedItems]);

  const keyExtractor = useCallback((item: NonNullable<typeof flattenedItems>[0]) => item.key, []);

  if (notifications.length === 0) {
    return <EmptyState filter={filter} />;
  }

  // Use VirtualList for long lists
  if (flattenedItems && flattenedItems.length > 20) {
    return (
      <VirtualList
        items={flattenedItems}
        renderItem={renderItem}
        estimateSize={estimateSize}
        overscan={5}
        keyExtractor={keyExtractor}
        containerClassName="h-full"
      />
    );
  }

  // For short lists, render normally with groups
  return (
    <div className="space-y-6">
      {groupedByTime.map(([timeGroup, notifs]) => (
        <div key={timeGroup} className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            {timeGroup}
          </h3>
          <div className="space-y-1">
            {notifs.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onArchive={onArchive}
                onDelete={onDelete}
                getIcon={getIcon}
                getPriorityStyles={getPriorityStyles}
                preferences={preferences}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
