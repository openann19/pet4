/**
 * Presence Avatar — Web with Aurora Ring
 * - Animated aurora ring using Reanimated alpha/rotate
 * - Reduced motion → static subtle ring
 *
 * Location: apps/web/src/components/chat/PresenceAvatar.tsx
 */

import { useMemo } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface PresenceAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  size?: number;
  className?: string;
}

export function PresenceAvatar({
  src,
  alt,
  fallback,
  status = 'online',
  size = 40,
  className,
}: PresenceAvatarProps) {
  const reduced = useReducedMotion();
  const rot = useSharedValue(0);

  const dur = getReducedMotionDuration(3600, reduced);
  useMemo(() => {
    rot.value = 0;
    if (!reduced && status !== 'offline') {
      rot.value = withRepeat(withTiming(360, { duration: dur }), -1, false);
    }
  }, [reduced, status, dur, rot]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
    opacity: status === 'offline' ? 0 : 1,
  })) as AnimatedStyle;

  const ringColors =
    status === 'online'
      ? 'from-emerald-400 via-cyan-400 to-blue-500'
      : status === 'away'
        ? 'from-amber-400 via-orange-400 to-rose-400'
        : 'from-rose-500 via-fuchsia-500 to-indigo-500';

  return (
    <div
      className={`relative inline-block ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <Avatar className="w-full h-full">
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
          {(fallback?.[0] ?? '?').toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {status !== 'offline' && (
        <AnimatedView
          style={ring}
          className={`pointer-events-none absolute -inset-0.5 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] ${ringColors} blur-[2px] opacity-80`}
        >
          <div />
        </AnimatedView>
      )}
    </div>
  );
}
