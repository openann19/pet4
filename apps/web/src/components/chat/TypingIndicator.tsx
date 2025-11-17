'use client';;
import { useEffect, useMemo } from 'react';
import {
  useAnimatedStyle,
  MotionView,
} from '@petspark/motion';
import { useMotionValue, animate } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TypingUser } from '@/lib/chat-types';
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
    const opacity = useMotionValue(0.3);
  const translateY = useMotionValue(0);

  useEffect(() => {
    const delay = index * 200;

    setTimeout(() => {
      animate(opacity, 1, {
        duration: 600,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      animate(translateY, -3, {
        duration: 600,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    }, delay);
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.get(),
      transform: [{ translateY: translateY.get() }],
    };
  });

  return <MotionView style={animatedStyle} className="w-1 h-1 bg-primary rounded-full" />;
}

export default function TypingIndicator({ users }: TypingIndicatorProps): JSX.Element | null {
  if (users.length === 0) return null;

  const displayUsers = useMemo(() => users.slice(0, 3), [users]);
  const containerOpacity = useMotionValue(0);
  const containerTranslateY = useMotionValue(-5);

  useEffect(() => {
    const duration = timingConfigs.smooth.duration ?? 300;
    animate(containerOpacity, 1, { duration });
    animate(containerTranslateY, 0, { duration });
  }, [containerOpacity, containerTranslateY]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.get(),
      transform: [{ translateY: containerTranslateY.get() }],
    };
  });

  const typingText = useMemo(() => {
    if (users.length === 1) {
      const userName = users[0]?.userName?.trim();
      return `${userName ?? 'Someone'} is typing`;
    }
    if (users.length === 2) {
      const userName1 = users[0]?.userName?.trim();
      const userName2 = users[1]?.userName?.trim();
      return `${userName1 ?? 'Someone'} and ${userName2 ?? 'Someone'} are typing`;
    }
    const firstName = users[0]?.userName?.trim();
    return `${firstName ?? 'Someone'} and ${users.length - 1} others are typing`;
  }, [users]);

  return (
    <MotionView
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
    </MotionView>
  );
}
