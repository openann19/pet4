"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  At,
  Bell,
  ChatCircle,
  Check,
  CheckCircle,
  Heart,
  UserPlus,
} from '@phosphor-icons/react';
import { MotionView, useAnimatedStyle, useSharedValue, withSpring } from '@petspark/motion';
import { toast } from 'sonner';

import { PostDetailView } from '@/components/community/PostDetailView';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';
import { communityService } from '@/lib/community-service';
import type { CommunityNotification } from '@/lib/community-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';

const logger = createLogger('NotificationsView');
function getNotificationIcon(type: CommunityNotification['type']) {
  switch (type) {
    case 'like':
      return Heart;
    case 'comment':
    case 'reply':
      return ChatCircle;
    case 'follow':
      return UserPlus;
    case 'mention':
      return At;
    case 'moderation':
      return CheckCircle;
    default:
      return Bell;
  }
}

function getNotificationMessage(notification: CommunityNotification): string {
  switch (notification.type) {
    case 'like':
      return `${String(notification.actorName ?? '')} liked your post`;
    case 'comment':
      return `${String(notification.actorName ?? '')} commented on your post`;
    case 'reply':
      return `${String(notification.actorName ?? '')} replied to your comment`;
    case 'follow':
      return `${String(notification.actorName ?? '')} started following you`;
    case 'mention':
      return `${String(notification.actorName ?? '')} mentioned you`;
    case 'moderation':
      return notification.content ?? 'Your content was reviewed';
    default:
      return notification.content ?? 'New notification';
  }
}

function EmptyStateView({ filter }: { filter: 'all' | 'unread' }) {
  const entry = useEntryAnimation({ initialY: 20, initialOpacity: 0 });

  return (
    <MotionView
      style={entry.animatedStyle}
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
          ? "You're all caught up!"
          : "When you get notifications, they'll appear here"}
      </p>
    </MotionView>
  );
}

interface NotificationItemViewProps {
  readonly notification: CommunityNotification;
  readonly index: number;
  readonly onNotificationClick: (notification: CommunityNotification) => void;
}

function NotificationItemView({
  notification,
  index,
  onNotificationClick,
}: NotificationItemViewProps): JSX.Element {
  const opacity = useSharedValue<number>(0);
  const translateX = useSharedValue<number>(-20);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      opacity.value = withSpring(1, { damping: 25, stiffness: 400 });
      translateX.value = withSpring(0, { damping: 25, stiffness: 400 });
    }, index * 30);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [index, opacity, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: `${String(translateX.value)}px` }],
  }));

  const Icon = getNotificationIcon(notification.type);
  const message = getNotificationMessage(notification);
  const ariaLabel = `${notification.read ? 'Read' : 'Unread'} notification: ${message}`;

  return (
    <MotionView
      style={animatedStyle}
      onClick={() => {
        onNotificationClick(notification);
      }}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onNotificationClick(notification);
        }
      }}
      className={`
        flex gap-3 p-3 rounded-lg cursor-pointer transition-colors
        ${notification.read
          ? 'hover:bg-muted/50'
          : 'bg-primary/5 hover:bg-primary/10 border border-primary/20'}
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
            <p className="text-sm font-medium line-clamp-2">{message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
          </div>
          {!notification.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
        </div>
      </div>
    </MotionView>
  );
}

interface NotificationsViewProps {
  readonly onBack?: () => void;
  readonly onPostClick?: (postId: string) => void;
  readonly onUserClick?: (userId: string) => void;
}

export default function NotificationsView({
  onBack,
  onPostClick,
  onUserClick,
}: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const notifs = await communityService.getNotifications();
      setNotifications(notifs);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load notifications', err);
      void toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      haptics.impact('light');
      try {
        await communityService.markNotificationRead(notificationId);
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification,
          ),
        );
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to mark notification as read', err);
      }
    },
    [],
  );

  const filteredNotifications = useMemo(
    () =>
      notifications
        .filter((notification) => filter === 'all' || !notification.read)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [notifications, filter],
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    haptics.impact('medium');
    try {
      const unreadIds = filteredNotifications.filter((notification) => !notification.read).map((notification) => notification.id);
      await Promise.all(unreadIds.map((id) => communityService.markNotificationRead(id)));
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      void toast.success('All notifications marked as read');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to mark all as read', err);
    }
  }, [filteredNotifications]);

  const handleNotificationClick = useCallback(
    (notification: CommunityNotification) => {
      if (!notification.read) {
        void handleMarkAsRead(notification.id).catch((error) => {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Failed to mark notification as read', err, {
            notificationId: notification.id,
          });
        });
      }

      if (notification.targetType === 'post' && notification.targetId) {
        setSelectedPostId(notification.targetId);
        if (onPostClick) {
          onPostClick(notification.targetId);
        }
      } else if (notification.targetType === 'user' && notification.targetId) {
        if (onUserClick) {
          onUserClick(notification.targetId);
        }
      }
    },
    [handleMarkAsRead, onPostClick, onUserClick],
  );

  return (
    <PageTransitionWrapper key="notifications-view" direction="up">
      <div className="flex flex-col h-full bg-background">
        <header role="banner" className="flex items-center gap-4 p-4 border-b bg-card">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full"
              aria-label="Go back to previous page"
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center">
              <Bell size={24} className="text-white" weight="fill" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} {unreadCount === 1 ? 'unread' : 'unread'}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => { void handleMarkAllAsRead(); }} className="text-xs">
                <Check size={14} className="mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </header>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread')} className="border-b">
          <TabsList className="w-full rounded-none">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <main role="main" aria-label="Notifications content">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="flex gap-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <EmptyStateView filter={filter} />
              ) : (
                filteredNotifications.map((notification, index) => (
                  <NotificationItemView
                    // MotionView already handles keying internally; using id ensures stable identity
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onNotificationClick={handleNotificationClick}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </main>

        {selectedPostId && (
          <PostDetailView
            open={!!selectedPostId}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedPostId(null);
              }
            }}
            postId={selectedPostId}
          />
        )}
      </div>
    </PageTransitionWrapper>
  );
}
