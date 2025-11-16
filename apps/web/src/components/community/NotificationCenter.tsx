import React, { useMemo } from 'react';
import { Presence, MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, X } from '@phosphor-icons/react';

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationCenterProps {
  items: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onDismiss?: (id: string) => void;
}

export function NotificationCenter({ items, onMarkAllRead, onClearAll, onDismiss }: NotificationCenterProps) {
  const hasItems = items.length > 0;
  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  return (
    <div className="w-full max-w-xl">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell size={22} />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onMarkAllRead} disabled={!hasItems}>
            <CheckCircle size={16} className="mr-1" /> Mark all read
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearAll} disabled={!hasItems}>
            <X size={16} className="mr-1" /> Clear
          </Button>
        </div>
      </header>

      <Presence visible={hasItems}>
        {hasItems ? (
          <MotionView
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="divide-y rounded-md border"
          >
            {items.map((n) => (
              <div key={n.id} className="p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Dismiss" onClick={() => onDismiss?.(n.id)}>
                  <X size={16} />
                </Button>
              </div>
            ))}
          </MotionView>
        ) : (
          <MotionView
            key="empty"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-md border p-8 text-center text-muted-foreground"
          >
            No notifications
          </MotionView>
        )}
      </Presence>
    </div>
  );
}

