/**
 * Empty State Component
 *
 * Displays when there are no notifications
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  MotionView,
} from '@petspark/motion';
import { Bell } from '@phosphor-icons/react';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@petspark/motion';
import type { NotificationFilter } from '../types';

export interface EmptyStateProps {
  filter: NotificationFilter;
}

export function EmptyState({ filter }: EmptyStateProps): JSX.Element {
  const emptyOpacity = useSharedValue(0);
  const emptyScale = useSharedValue(0.9);
  const bellRotate = useSharedValue(0);
  const bellScale = useSharedValue(1);

  useEffect(() => {
    emptyOpacity.value = withTiming(1, timingConfigs.smooth);
    emptyScale.value = withSpring(1, springConfigs.smooth);

    bellRotate.value = withDelay(
      2000,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 200 }),
          withTiming(10, { duration: 200 }),
          withTiming(0, { duration: 200 })
        ),
        -1,
        true
      )
    );

    bellScale.value = withDelay(
      2000,
      withRepeat(
        withSequence(withSpring(1.1, springConfigs.bouncy), withSpring(1, springConfigs.smooth)),
        -1,
        true
      )
    );
  }, [emptyOpacity, emptyScale, bellRotate, bellScale]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacity.value,
    transform: [{ scale: emptyScale.value }],
  })) as AnimatedStyle;

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${bellRotate.value}deg` }, { scale: bellScale.value }],
  })) as AnimatedStyle;

  return (
    <MotionView
      style={containerStyle}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <MotionView style={bellStyle} className="mb-4">
        <Bell size={48} className="text-muted-foreground" />
      </MotionView>
      <p className="text-muted-foreground mt-4 text-center text-lg font-medium">
        {filter === 'unread' && 'All caught up!'}
        {filter === 'archived' && 'No archived notifications'}
        {filter === 'all' && 'No notifications yet'}
      </p>
      <p className="text-sm text-muted-foreground/60 mt-1 text-center max-w-xs">
        {filter === 'unread' && "You've read all your notifications"}
        {filter === 'archived' && 'Archived notifications will appear here'}
        {filter === 'all' && "We'll notify you when something important happens"}
      </p>
    </MotionView>
  );
}
