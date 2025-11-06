import { useState } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { useStaggeredItem } from '@/effects/reanimated/use-staggered-item'
import { MotionView } from '@petspark/motion'
import { Bell, X, Check, CheckCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

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
  const [notifications, setNotifications] = useStorage<Notification[]>('notifications', [])
  const [isOpen, setIsOpen] = useState(false)
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
        >
          <Bell size={20} weight={unreadCount > 0 ? 'fill' : 'regular'} />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCircle size={16} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-2 px-4">
            <TabsTrigger value="all">
              All ({(notifications || []).length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-0">
            <ScrollArea className="h-[400px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Bell size={48} className="mb-4 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {groupedNotifications.today.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                        Today
                      </div>
                      {groupedNotifications.today.map((notification, index) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          index={index}
                          onMarkAsRead={markAsRead}
                          onDelete={deleteNotification}
                        />
                      ))}
                    </div>
                  )}

                  {groupedNotifications.earlier.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                        Earlier
                      </div>
                      {groupedNotifications.earlier.map((notification, index) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          index={groupedNotifications.today.length + index}
                          onMarkAsRead={markAsRead}
                          onDelete={deleteNotification}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {(notifications || []).length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="w-full text-xs text-muted-foreground"
            >
              Clear all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  index
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  index: number
}) {
  const staggered = useStaggeredItem({ index, staggerDelay: 30 })

  return (
    <MotionView
      animatedStyle={staggered.itemStyle}
      className={cn(
        'group relative p-4 hover:bg-muted/50 transition-colors',
        !notification.read && 'bg-primary/5'
      )}
    >
      <div className="flex gap-3">
        <div className="shrink-0">
          {notification.imageUrl ? (
            <img
              src={notification.imageUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              {getNotificationIcon(notification.type)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
              </p>
            </div>

            {!notification.read && (
              <div className="shrink-0 w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMarkAsRead(notification.id)}
          >
            <Check size={14} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onDelete(notification.id)}
        >
          <X size={14} />
        </Button>
      </div>
    </AnimatedView>
  )
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
