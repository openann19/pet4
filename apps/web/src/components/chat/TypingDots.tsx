'use client';

import React, { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  animate,
} from '@petspark/motion';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TypingDotsProps {
  dotSize?: number;
  dotColor?: string;
  gap?: number;
  animationDuration?: number;
  className?: string;
}

const DEFAULT_DOT_SIZE = 6;
const DEFAULT_DOT_COLOR = '#aaa';
const DEFAULT_GAP = 4;
const DEFAULT_ANIMATION_DURATION = 1200;

export function TypingDots({
  dotSize = DEFAULT_DOT_SIZE,
  dotColor = DEFAULT_DOT_COLOR,
  gap = DEFAULT_GAP,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  className,
}: TypingDotsProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity1 = useSharedValue(0.5);
  const opacity2 = useSharedValue(0.5);
  const opacity3 = useSharedValue(0.5);

  useEffect(() => {
    const delay2 = 150;
    const delay3 = 300;

    const scale1Sequence = withSequence(
      withTiming(1.4, {
        duration: animationDuration / 2,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(1, {
        duration: animationDuration / 2,
        easing: Easing.in(Easing.ease),
      })
    );
    const scale1Repeat = withRepeat(scale1Sequence, -1, false);
    animate(scale1, scale1Repeat.target, scale1Repeat.transition);

    const scale2Sequence = withSequence(
      withTiming(1.4, {
        duration: animationDuration / 2,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(1, {
        duration: animationDuration / 2,
        easing: Easing.in(Easing.ease),
      })
    );
    const scale2Repeat = withRepeat(scale2Sequence, -1, false);
    const scale2Delay = withDelay(delay2, scale2Repeat);
    animate(scale2, scale2Delay.target, scale2Delay.transition);

    const scale3Sequence = withSequence(
      withTiming(1.4, {
        duration: animationDuration / 2,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(1, {
        duration: animationDuration / 2,
        easing: Easing.in(Easing.ease),
      })
    );
    const scale3Repeat = withRepeat(scale3Sequence, -1, false);
    const scale3Delay = withDelay(delay3, scale3Repeat);
    animate(scale3, scale3Delay.target, scale3Delay.transition);

    const opacity1Sequence = withSequence(
      withTiming(1, {
        duration: animationDuration / 2,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(0.5, {
        duration: animationDuration / 2,
        easing: Easing.in(Easing.ease),
      })
    );
    const opacity1Repeat = withRepeat(opacity1Sequence, -1, false);
    animate(opacity1, opacity1Repeat.target, opacity1Repeat.transition);

    const opacity2Sequence = withSequence(
      withTiming(1, {
        duration: animationDuration / 2,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(0.5, {
        duration: animationDuration / 2,
        easing: Easing.in(Easing.ease),
      })
    );
    const opacity2Repeat = withRepeat(opacity2Sequence, -1, false);
    const opacity2Delay = withDelay(delay2, opacity2Repeat);
    animate(opacity2, opacity2Delay.target, opacity2Delay.transition);

    const opacity3Sequence = withSequence(
      withTiming(1, {
        duration: animationDuration / 2,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(0.5, {
        duration: animationDuration / 2,
        easing: Easing.in(Easing.ease),
      })
    );
    const opacity3Repeat = withRepeat(opacity3Sequence, -1, false);
    const opacity3Delay = withDelay(delay3, opacity3Repeat);
    animate(opacity3, opacity3Delay.target, opacity3Delay.transition);
  }, [scale1, scale2, scale3, opacity1, opacity2, opacity3, animationDuration]);

  const dot1Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale1.get() }],
      opacity: opacity1.get(),
    };
  });

  const dot2Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale2.get() }],
      opacity: opacity2.get(),
    };
  });

  const dot3Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale3.get() }],
      opacity: opacity3.get(),
    };
  });

  const staticDotStyle: React.CSSProperties = {
    width: dotSize,
    height: dotSize,
    backgroundColor: dotColor,
    borderRadius: dotSize / 2,
  };

  return (
    <div className={cn('flex items-center', className)} style={{ gap }}>
      <div style={staticDotStyle}>
        <AnimatedView style={dot1Style} className="rounded-full w-full h-full">
          <div />
        </AnimatedView>
      </div>
      <div style={staticDotStyle}>
        <AnimatedView style={dot2Style} className="rounded-full w-full h-full">
          <div />
        </AnimatedView>
      </div>
      <div style={staticDotStyle}>
        <AnimatedView style={dot3Style} className="rounded-full w-full h-full">
          <div />
        </AnimatedView>
      </div>
    </div>
  );
}
