'use client'

import React, { useEffect, useMemo } from 'react';
import { interpolate, useAnimatedStyle, useSharedValue, withTiming, MotionView } from '@petspark/motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '../core/reduced-motion';
import { motionTheme } from '@/config/motionTheme';

type DeliveryState = 'sending' | 'sent' | 'delivered' | 'read';

export interface WebDeliveryTicksProps {
  state: DeliveryState;
  className?: string;
}

const STATE_PROGRESS: Record<DeliveryState, number> = {
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

export function WebDeliveryTicks({ state, className }: WebDeliveryTicksProps): React.ReactElement {
  const progress = useSharedValue(STATE_PROGRESS[state] ?? 0);
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? motionTheme.durations.fast : motionTheme.durations.normal;

  const colors = useMemo(
    () => [
      'var(--muted-foreground)',
      'var(--muted-foreground)',
      'var(--accent-foreground, var(--primary))',
      'var(--primary)',
    ],
    []
  );

  useEffect(() => {
    const target = STATE_PROGRESS[state] ?? 0;
    progress.value = withTiming(target, {
      duration,
      easing: undefined,
    });
  }, [duration, progress, state]);

  const containerStyle = useAnimatedStyle(() => {
    const colorIndex = Math.round(interpolate(progress.value, [0, 1, 2, 3], [0, 1, 2, 3]));
    const color = colors[colorIndex] ?? colors[1];
    return {
      color,
    };
  });

  const firstTickStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5], [0.4, 1]);
    return {
      opacity,
    };
  });

  const secondTickStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0.5, 1], [0, 1]);
    const translateX = interpolate(progress.value, [1, 2, 3], [4, 6, 8]);
    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  return (
    <MotionView
      style={containerStyle}
      className={cn('inline-flex items-center gap-1 text-xs font-medium leading-none', className)}
      role="status"
      aria-live="polite"
      aria-label={`Message ${state}`}
    >
      <MotionView style={firstTickStyle} className="inline-flex">
        <span>✓</span>
      </MotionView>
      <MotionView style={secondTickStyle} className="inline-flex">
        <span>✓</span>
      </MotionView>
    </MotionView>
  );
}

export default WebDeliveryTicks
