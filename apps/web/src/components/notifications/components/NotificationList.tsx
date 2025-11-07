/**
 * Notification List Component
 * 
 * Displays list of notifications
 */

import { useMemo } from 'react'
import { isToday, isYesterday, isSameWeek, formatDistanceToNow } from 'date-fns'
import type { PremiumNotification, NotificationPreferences, NotificationFilter } from '../types'
import { NotificationItem, type GetIconFunction, type GetPriorityStylesFunction } from './NotificationItem'
import { EmptyState } from './EmptyState'

export interface NotificationListProps {
  notifications: PremiumNotification[]
  filter: NotificationFilter
  preferences: NotificationPreferences | null
  onMarkAsRead: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  getIcon: GetIconFunction
  getPriorityStyles: GetPriorityStylesFunction
}

export function NotificationList({
  notifications,
  filter,
  preferences,
  onMarkAsRead,
  onArchive,
  onDelete,
  getIcon,
  getPriorityStyles
}: NotificationListProps): JSX.Element {
  const groupedByTime = useMemo(() => {
    const groups = new Map<string, PremiumNotification[]>()
    
    notifications.forEach((notification) => {
      const date = new Date(notification.timestamp)
      let timeGroup: string
      
      if (isToday(date)) {
        timeGroup = 'Today'
      } else if (isYesterday(date)) {
        timeGroup = 'Yesterday'
      } else if (isSameWeek(date, new Date())) {
        timeGroup = 'This Week'
      } else {
        timeGroup = formatDistanceToNow(date, { addSuffix: false })
      }
      
      if (!groups.has(timeGroup)) {
        groups.set(timeGroup, [])
      }
      groups.get(timeGroup)!.push(notification)
    })
    
    return Array.from(groups.entries())
  }, [notifications])

  if (notifications.length === 0) {
    return <EmptyState filter={filter} />
  }

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
  )
}
