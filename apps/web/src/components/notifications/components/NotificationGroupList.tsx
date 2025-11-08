/**
 * Notification Group List Component
 *
 * Displays grouped notifications
 */

import { useMemo } from 'react';
import { isToday, isYesterday, isSameWeek, formatDistanceToNow } from 'date-fns';
import type { NotificationGroup, NotificationPreferences, NotificationFilter } from '../types';
import { NotificationGroupItem } from './NotificationGroupItem';
import { EmptyState } from './EmptyState';
import type { GetIconFunction, GetPriorityStylesFunction } from './NotificationItem';

export interface NotificationGroupListProps {
  groups: NotificationGroup[];
  filter: NotificationFilter;
  preferences: NotificationPreferences | null;
  onMarkAsRead: (groupId: string) => void;
  onArchive: (groupId: string) => void;
  onDelete: (groupId: string) => void;
  getIcon: GetIconFunction;
  getPriorityStyles: GetPriorityStylesFunction;
}

export function NotificationGroupList({
  groups,
  filter,
  preferences,
  onMarkAsRead,
  onArchive,
  onDelete,
  getIcon,
  getPriorityStyles,
}: NotificationGroupListProps): JSX.Element {
  const groupedByTime = useMemo(() => {
    const timeGroups = new Map<string, NotificationGroup[]>();

    groups.forEach((group) => {
      const date = new Date(group.timestamp);
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

      if (!timeGroups.has(timeGroup)) {
        timeGroups.set(timeGroup, []);
      }
      timeGroups.get(timeGroup)!.push(group);
    });

    return Array.from(timeGroups.entries());
  }, [groups]);

  if (groups.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <div className="space-y-6">
      {groupedByTime.map(([timeGroup, timeGroups]) => (
        <div key={timeGroup} className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            {timeGroup}
          </h3>
          <div className="space-y-2">
            {timeGroups.map((group, index) => (
              <NotificationGroupItem
                key={group.id}
                group={group}
                index={index}
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
