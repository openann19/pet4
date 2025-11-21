/**
 * Notification Item Component
 *
 * Individual notification item with animations
 */

import { memo, useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { Check, Trash, Archive } from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { useHoverTap } from '@/effects/reanimated';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@petspark/motion';
import { cn } from '@/lib/utils';
import type { PremiumNotification, NotificationPreferences } from '../types';

export type GetIconFunction = (
  type: PremiumNotification['type'],
  priority: PremiumNotification['priority']
) => React.ReactNode;
export type GetPriorityStylesFunction = (priority: PremiumNotification['priority']) => string;

export interface NotificationItemProps {
  notification: PremiumNotification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: GetIconFunction;
  getPriorityStyles?: GetPriorityStylesFunction;
  preferences?: NotificationPreferences | null;
}

function NotificationItemComponent({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  getIcon,
}: NotificationItemProps): JSX.Element {
  const itemOpacity = useSharedValue(0);
  const itemTranslateY = useSharedValue(20);
  const hover = useHoverTap({
    hoverScale: 1.005,
    tapScale: 1,
  });

  useEffect(() => {
    itemOpacity.value = withTiming(1, timingConfigs.smooth);
    itemTranslateY.value = withSpring(0, springConfigs.smooth);
  }, [itemOpacity, itemTranslateY]);

  const itemStyle = useAnimatedStyle(() => ({
    opacity: itemOpacity.value,
    transform: [{ translateY: itemTranslateY.value, scale: hover.scale.value }],
  })) as AnimatedStyle;

  const unreadDotScale = useSharedValue(notification.read ? 0 : 1);

  useEffect(() => {
    unreadDotScale.value = withSpring(notification.read ? 0 : 1, springConfigs.bouncy);
  }, [notification.read, unreadDotScale]);

  const unreadDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: unreadDotScale.value }],
  })) as AnimatedStyle;

  return (
    <MotionView
      style={itemStyle}
      onMouseEnter={hover.handleMouseEnter}
      onMouseLeave={hover.handleMouseLeave}
      className={cn(
        'relative rounded-xl overflow-hidden transition-all bg-card border border-border/50 p-4',
        !notification.read && 'ring-2 ring-primary/20'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 relative">
          {getIcon(notification.type, notification.priority)}
          {!notification.read && (
            <MotionView
              style={unreadDotStyle}
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary"
            >
              {null}
            </MotionView>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight">{notification.title}</h4>
              <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
                {notification.message}
              </p>
            </div>

            {!notification.read && (
              <MotionView
                style={unreadDotStyle}
                className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1"
              >
                {null}
              </MotionView>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>

            <div className="flex items-center gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => { onMarkAsRead(notification.id); }}
                >
                  <Check size={16} />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => { onArchive(notification.id); }}
              >
                <Archive size={16} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-destructive"
                onClick={() => { onDelete(notification.id); }}
              >
                <Trash size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MotionView>
  );
}

// Memoize NotificationItem to prevent unnecessary re-renders
export const NotificationItem = memo(NotificationItemComponent, (prev, next) => {
  return (
    prev.notification.id === next.notification.id &&
    prev.notification.read === next.notification.read &&
    prev.notification.timestamp === next.notification.timestamp &&
    prev.notification.title === next.notification.title &&
    prev.notification.message === next.notification.message &&
    prev.onMarkAsRead === next.onMarkAsRead &&
    prev.onArchive === next.onArchive &&
    prev.onDelete === next.onDelete &&
    prev.getIcon === next.getIcon
  );
});
