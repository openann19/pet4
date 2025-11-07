'use client'

import { PostDetailView } from '@/components/community/PostDetailView'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { communityService } from '@/lib/community-service'
import type { CommunityNotification } from '@/lib/community-types'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'
import { ArrowLeft, At, Bell, ChatCircle, Check, CheckCircle, Heart, UserPlus } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import { motion } from '@petspark/motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { isTruthy, isDefined } from '@/core/guards';

const logger = createLogger('NotificationsView')

interface NotificationsViewProps {
  onBack?: () => void
  onPostClick?: (postId: string) => void
  onUserClick?: (userId: string) => void
}

export default function NotificationsView({
  onBack,
  onPostClick,
  onUserClick
}: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<CommunityNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const notifs = await communityService.getNotifications()
      setNotifications(notifs)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to load notifications', err)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    haptics.impact('light')
    try {
      await communityService.markNotificationRead(notificationId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ))
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to mark notification as read', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    haptics.impact('medium')
    try {
      const unreadIds = filteredNotifications.filter(n => !n.read).map(n => n.id)
      await Promise.all(unreadIds.map(id => communityService.markNotificationRead(id)))
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to mark all as read', err)
    }
  }

  const handleNotificationClick = (notification: CommunityNotification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    if (notification.targetType === 'post' && notification.targetId) {
      setSelectedPostId(notification.targetId)
      if (isTruthy(onPostClick)) {
        onPostClick(notification.targetId)
      }
    } else if (notification.targetType === 'user' && notification.targetId) {
      if (isTruthy(onUserClick)) {
        onUserClick(notification.targetId)
      }
    }
  }

  const getNotificationIcon = (type: CommunityNotification['type']) => {
    switch (type) {
      case 'like':
        return Heart
      case 'comment':
      case 'reply':
        return ChatCircle
      case 'follow':
        return UserPlus
      case 'mention':
        return At
      case 'moderation':
        return CheckCircle
      default:
        return Bell
    }
  }

  const getNotificationMessage = (notification: CommunityNotification): string => {
    switch (notification.type) {
      case 'like':
        return `${String(notification.actorName ?? '')} liked your post`
      case 'comment':
        return `${String(notification.actorName ?? '')} commented on your post`
      case 'reply':
        return `${String(notification.actorName ?? '')} replied to your comment`
      case 'follow':
        return `${String(notification.actorName ?? '')} started following you`
      case 'mention':
        return `${String(notification.actorName ?? '')} mentioned you`
      case 'moderation':
        return notification.content || 'Your content was reviewed'
      default:
        return notification.content || 'New notification'
    }
  }

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || !n.read
  ).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-card">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
        )}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bell size={24} className="text-white" weight="fill" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} {unreadCount === 1 ? 'unread' : 'unread'}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <Check size={14} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={(v) => { setFilter(v as 'all' | 'unread'); }} className="border-b">
        <TabsList className="w-full rounded-none">
          <TabsTrigger value="all" className="flex-1">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex-1">
            Unread {unreadCount > 0 && `(${String(unreadCount ?? '')})`}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <MotionView
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell size={48} className="text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                {filter === 'unread' 
                  ? 'You\'re all caught up!'
                  : 'When you get notifications, they\'ll appear here'}
              </p>
            </MotionView>
          ) : (
            filteredNotifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type)
              const message = getNotificationMessage(notification)
              
              return (
                <MotionView
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => { handleNotificationClick(notification); }}
                  className={`
                    flex gap-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${String(notification.read 
                                            ? 'hover:bg-muted/50' 
                                            : 'bg-primary/5 hover:bg-primary/10 border border-primary/20' ?? '')
                    }
                  `}
                >
                  <Avatar
                    {...(notification.actorAvatar && { src: notification.actorAvatar })}
                    className="w-12 h-12"
                  >
                    <Icon size={20} />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-2">
                          {message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                </MotionView>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Post Detail Dialog */}
      {selectedPostId && (
        <PostDetailView
          open={!!selectedPostId}
          onOpenChange={(open) => {
            if (!open) setSelectedPostId(null)
          }}
          postId={selectedPostId}
        />
      )}
    </div>
  )
}
