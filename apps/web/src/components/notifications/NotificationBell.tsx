'use client';;
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Bell, BellRinging } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { haptics } from '@/lib/haptics';
import { NotificationCenter, type AppNotification } from './NotificationCenter';
import {
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  MotionView,
  type AnimatedStyle,
} from '@petspark/motion';


export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useStorage<AppNotification[]>('app-notifications', []);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const unreadCount = useMemo(() => {
    return (notifications ?? []).filter((n) => !n.read).length;
  }, [notifications]);

  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotification(true);
      const timer = setTimeout(() => setHasNewNotification(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [unreadCount]);

  const handleClick = useCallback(() => {
    haptics.trigger('medium');
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => void handleClick()}
        className="relative rounded-full w-11 h-11 hover:bg-primary/10 active:bg-primary/20 transition-colors shrink-0 touch-manipulation"
        aria-label={`Notifications${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}`}
      >
        <BellIconView hasNewNotification={hasNewNotification} unreadCount={unreadCount} />

        {unreadCount > 0 && <BadgeView unreadCount={unreadCount} />}

        {unreadCount > 0 && <PulseRingView />}
      </Button>

      <NotificationCenter isOpen={isOpen} onClose={handleClose} />
    </>
  );
}

interface BellIconViewProps {
  hasNewNotification: boolean;
  unreadCount: number;
}

function BellIconView({ hasNewNotification, unreadCount }: BellIconViewProps) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (hasNewNotification && unreadCount > 0) {
      rotate.value = withSequence(
        withTiming(-15, { duration: 150 }),
        withTiming(15, { duration: 150 }),
        withTiming(-15, { duration: 150 }),
        withTiming(15, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
      scale.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 }),
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    } else {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [hasNewNotification, unreadCount, rotate, scale, opacity]);

  const iconStyle = useAnimatedStyle((): Record<string, unknown> => {
    return {
      transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  if (hasNewNotification && unreadCount > 0) {
    return (
      <MotionView style={iconStyle}>
        <BellRinging size={20} weight="fill" className="text-primary" />
      </MotionView>
    );
  }

  return (
    <MotionView style={iconStyle}>
      <Bell
        size={20}
        weight={unreadCount > 0 ? 'fill' : 'regular'}
        className={unreadCount > 0 ? 'text-primary' : 'text-foreground/80'}
      />
    </MotionView>
  );
}

interface BadgeViewProps {
  unreadCount: number;
}

function BadgeView({ unreadCount }: BadgeViewProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [scale, opacity]);

  const badgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  return (
    <MotionView style={badgeStyle} className="absolute -top-1 -right-1">
      <Badge
        variant="destructive"
        className="h-5 min-w-5 px-1 rounded-full text-xs font-bold flex items-center justify-center shadow-lg"
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </Badge>
    </MotionView>
  );
}

function PulseRingView() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.3, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 1000 }), withTiming(0.5, { duration: 1000 })),
      -1,
      false
    );
  }, [scale, opacity]);

  const ringStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  return (
    <MotionView
      style={ringStyle}
      className="absolute inset-0 rounded-full border-2 border-primary pointer-events-none"
    />
  );
}
