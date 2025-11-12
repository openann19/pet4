'use client';

import { useEffect, useMemo } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TypingUser } from '@/lib/chat-types';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { timingConfigs } from '@/effects/reanimated/transitions';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TypingIndicatorProps {
  readonly users: readonly TypingUser[];
}

interface TypingDotProps {
  index: number;
}

function TypingDot({ index }: TypingDotProps): JSX.Element {
    const _uiConfig = useUIConfig();
    const opacity = useSharedValue(0.3);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const delay = index * 200;

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })),
        -1,
        false
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(-3, { duration: 300 }), withTiming(0, { duration: 300 })),
        -1,
        false
      )
    );
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  }) as AnimatedStyle;

  return <AnimatedView style={animatedStyle} className="w-1 h-1 bg-primary rounded-full" />;
}

export default function TypingIndicator({ users }: TypingIndicatorProps): JSX.Element | null {
  if (users.length === 0) return null;

  const displayUsers = useMemo(() => users.slice(0, 3), [users]);
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(-5);

  useEffect(() => {
    containerOpacity.value = withTiming(1, timingConfigs.smooth);
    containerTranslateY.value = withTiming(0, timingConfigs.smooth);
  }, [containerOpacity, containerTranslateY]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [{ translateY: containerTranslateY.value }],
    };
  }) as AnimatedStyle;

  const typingText = useMemo(() => {
    if (users.length === 1) {
      const userName = users[0]?.userName?.trim();
      return `${userName || 'Someone'} is typing`;
    }
    if (users.length === 2) {
      const userName1 = users[0]?.userName?.trim();
      const userName2 = users[1]?.userName?.trim();
      return `${userName1 || 'Someone'} and ${userName2 || 'Someone'} are typing`;
    }
    const firstName = users[0]?.userName?.trim();
    return `${firstName || 'Someone'} and ${users.length - 1} others are typing`;
  }, [users]);

  return (
    <AnimatedView
      style={containerStyle}
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <Avatar key={user.userId} className="w-4 h-4 ring-1 ring-background">
            <AvatarImage src={(user as { userAvatar?: string }).userAvatar} alt={user.userName} />
            <AvatarFallback className="text-[8px]">{user.userName?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
        ))}
      </div>

      <div className="flex items-center gap-1 text-xs text-primary">
        <span>{typingText}</span>
        <div className="flex gap-0.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <TypingDot key={i} index={i} />
          ))}
        </div>
      </div>
    </AnimatedView>
  );
}
