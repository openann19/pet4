import { useState } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { motion, Presence } from '@petspark/motion'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  BellRinging,
  Heart,
  ChatCircle,
  CheckCircle,
  Info,
  Check,
  Trash,
  DotsThreeVertical,
  Camera,
  ShieldCheck
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export interface AppNotification {
  id: string
  type: 'match' | 'message' | 'like' | 'verification' | 'story' | 'system' | 'moderation'
  title: string
  message: string
  timestamp: number
  read: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl?: string
  actionLabel?: string
  imageUrl?: string
  metadata?: {
    petName?: string
    userName?: string
    matchId?: string
    messageId?: string
    count?: number
  }
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useStorage<AppNotification[]>('app-notifications', [])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const unreadCount = (notifications || []).filter(n => !n.read).length

  const filteredNotifications = (notifications || [])
    .filter(n => filter === 'all' || !n.read)
    .filter(n => selectedCategory === 'all' || n.type === selectedCategory)
    .sort((a, b) => b.timestamp - a.timestamp)

  const markAsRead = (id: string) => {
    haptics.trigger('light')
    setNotifications(current =>
      (current || []).map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    haptics.trigger('medium')
    setNotifications(current =>
      (current || []).map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    haptics.trigger('medium')
    setNotifications(current =>
      (current || []).filter(n => n.id !== id)
    )
  }

  const deleteAllRead = () => {
    haptics.trigger('heavy')
    setNotifications(current =>
      (current || []).filter(n => !n.read)
    )
  }

  const getNotificationIcon = (type: AppNotification['type'], priority: AppNotification['priority']) => {
    const iconProps = {
      size: 24,
      weight: priority === 'urgent' || priority === 'high' ? 'fill' : 'regular'
    } as const

    switch (type) {
      case 'match':
        return <Heart {...iconProps} className="text-primary" />
      case 'message':
        return <ChatCircle {...iconProps} className="text-secondary" />
      case 'like':
        return <Heart {...iconProps} className="text-accent" />
      case 'verification':
        return <CheckCircle {...iconProps} className="text-green-500" />
      case 'story':
        return <Camera {...iconProps} className="text-purple-500" />
      case 'moderation':
        return <ShieldCheck {...iconProps} className="text-orange-500" />
      case 'system':
        return <Info {...iconProps} className="text-blue-500" />
      default:
        return <Bell {...iconProps} />
    }
  }

  const getPriorityStyles = (priority: AppNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-l-destructive bg-destructive/5'
      case 'high':
        return 'border-l-4 border-l-accent bg-accent/5'
      case 'normal':
        return 'border-l-2 border-l-border'
      case 'low':
        return 'border-l border-l-border/50'
    }
  }

  const categories = [
    { value: 'all', label: 'All', icon: Bell },
    { value: 'match', label: 'Matches', icon: Heart },
    { value: 'message', label: 'Messages', icon: ChatCircle },
    { value: 'like', label: 'Likes', icon: Heart },
    { value: 'verification', label: 'Verified', icon: CheckCircle },
    { value: 'story', label: 'Stories', icon: Camera },
  ]

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-br from-background via-primary/5 to-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MotionView
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut"
                  }}
                >
                  <BellRinging size={28} weight="fill" className="text-primary" />
                </MotionView>
                <div>
                  <SheetTitle className="text-xl">Notifications</SheetTitle>
                  {unreadCount > 0 && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {unreadCount} unread
                    </p>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <DotsThreeVertical size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
                    <Check size={16} className="mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={deleteAllRead} disabled={(notifications || []).every(n => !n.read)}>
                    <Trash size={16} className="mr-2" />
                    Clear read
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 -mb-2">
              {categories.map((cat) => {
                const Icon = cat.icon
                const count = (notifications || []).filter(n => 
                  (cat.value === 'all' || n.type === cat.value) && !n.read
                ).length

                return (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      haptics.trigger('selection')
                      setSelectedCategory(cat.value)
                    }}
                    className={cn(
                      'rounded-full shrink-0 h-9',
                      selectedCategory === cat.value && 'shadow-lg'
                    )}
                  >
                    <Icon size={16} weight="fill" className="mr-1.5" />
                    {cat.label}
                    {count > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 min-w-[20px] h-5 rounded-full text-xs font-bold"
                      >
                        {count}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </SheetHeader>

          <div className="flex items-center gap-2 px-6 py-3 bg-muted/30">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                haptics.trigger('selection')
                setFilter('all')
              }}
              className="rounded-full flex-1"
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                haptics.trigger('selection')
                setFilter('unread')
              }}
              className="rounded-full flex-1"
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 min-w-[20px] h-5 rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              <Presence mode="popLayout">
                {filteredNotifications.length === 0 ? (
                  <MotionView
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center py-16 px-4"
                  >
                    <MotionView
                      animate={{
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                    >
                      <Bell size={64} weight="thin" className="text-muted-foreground/40" />
                    </MotionView>
                    <p className="text-muted-foreground mt-4 text-center">
                      {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                    </p>
                    <p className="text-sm text-muted-foreground/60 mt-1 text-center">
                      We'll notify you when something important happens
                    </p>
                  </MotionView>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification, index) => (
                      <MotionView
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ 
                          delay: index * 0.02,
                          layout: { duration: 0.2 }
                        }}
                      >
                        <NotificationItem
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onDelete={deleteNotification}
                          getIcon={getNotificationIcon}
                          getPriorityStyles={getPriorityStyles}
                        />
                      </MotionView>
                    ))}
                  </div>
                )}
              </Presence>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface NotificationItemProps {
  notification: AppNotification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  getIcon: (type: AppNotification['type'], priority: AppNotification['priority']) => React.ReactNode
  getPriorityStyles: (priority: AppNotification['priority']) => string
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  getIcon,
  getPriorityStyles
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <MotionView
      className={cn(
        'relative rounded-xl overflow-hidden transition-all',
        !notification.read && 'bg-primary/5',
        getPriorityStyles(notification.priority)
      )}
      onHoverStart={() => { setIsHovered(true); }}
      onHoverEnd={() => { setIsHovered(false); }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <MotionView
            className={cn(
              'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
              notification.priority === 'urgent' && 'bg-destructive/10',
              notification.priority === 'high' && 'bg-accent/10',
              notification.priority === 'normal' && 'bg-primary/10',
              notification.priority === 'low' && 'bg-muted'
            )}
            animate={{
              scale: !notification.read && notification.priority === 'urgent' 
                ? [1, 1.1, 1] 
                : 1
            }}
            transition={{ 
              duration: 1, 
              repeat: !notification.read && notification.priority === 'urgent' ? Infinity : 0 
            }}
          >
            {getIcon(notification.type, notification.priority)}
          </MotionView>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  'font-semibold text-sm leading-tight',
                  !notification.read && 'text-foreground',
                  notification.read && 'text-muted-foreground'
                )}>
                  {notification.title}
                </h4>
                <p className={cn(
                  'text-sm mt-1 leading-relaxed',
                  !notification.read && 'text-foreground/80',
                  notification.read && 'text-muted-foreground/70'
                )}>
                  {notification.message}
                </p>
              </div>

              {!notification.read && (
                <MotionView
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1"
                />
              )}
            </div>

            {notification.metadata && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {notification.metadata.petName && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {notification.metadata.petName}
                  </Badge>
                )}
                {notification.metadata.count && notification.metadata.count > 1 && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    +{notification.metadata.count} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-3 gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
              </span>

              <div className="flex items-center gap-1">
                <Presence>
                  {isHovered && (
                    <>
                      {!notification.read && (
                        <MotionView
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => { onMarkAsRead(notification.id); }}
                          >
                            <Check size={16} />
                          </Button>
                        </MotionView>
                      )}
                      <MotionView
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ delay: 0.05 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => { onDelete(notification.id); }}
                        >
                          <Trash size={16} />
                        </Button>
                      </MotionView>
                    </>
                  )}
                </Presence>

                {notification.actionLabel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-8 text-xs"
                    onClick={() => haptics.trigger('medium')}
                  >
                    {notification.actionLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {notification.priority === 'urgent' && !notification.read && (
        <MotionView
          className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-destructive via-accent to-destructive"
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity
          }}
        />
      )}
    </MotionView>
  )
}
