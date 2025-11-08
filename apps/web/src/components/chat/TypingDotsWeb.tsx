'use client';

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { cn } from '@/lib/utils';

export interface TypingDotsWebProps {
  dotSize?: number;
  dotColor?: string;
  gap?: number;
  animationDuration?: number;
  className?: string;
}

const DEFAULT_DOT_SIZE = 6;
const DEFAULT_DOT_COLOR = '#9ca3af';
const DEFAULT_GAP = 4;
const DEFAULT_ANIMATION_DURATION = 1200;

export function TypingDotsWeb({
  dotSize = DEFAULT_DOT_SIZE,
  dotColor = DEFAULT_DOT_COLOR,
  gap = DEFAULT_GAP,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  className,
}: TypingDotsWebProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center', className)} style={{ gap }}>
      {[0, 1, 2].map((index) => (
        <TypingDot
          key={index}
          dotSize={dotSize}
          dotColor={dotColor}
          animationDuration={animationDuration}
          delay={index * 200}
        />
      ))}
    </div>
  );
}

function TypingDot({
  dotSize,
  dotColor,
  animationDuration,
  delay,
}: {
  dotSize: number;
  dotColor: string;
  animationDuration: number;
  delay: number;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.4, { duration: animationDuration / 3 }),
          withTiming(1, { duration: animationDuration / 3 })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: animationDuration / 3 }),
          withTiming(0.5, { duration: animationDuration / 3 })
        ),
        -1,
        true
      )
    );
  }, [delay, animationDuration, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    width: dotSize,
    height: dotSize,
    backgroundColor: dotColor,
  })) as AnimatedStyle;

  return (
    <AnimatedView style={animatedStyle} className="rounded-full">
      <div />
    </AnimatedView>
  );
}
