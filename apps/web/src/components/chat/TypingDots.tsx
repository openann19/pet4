'use client';

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { cn } from '@/lib/utils';

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
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const opacity1 = useSharedValue(0.5);
  const opacity2 = useSharedValue(0.5);
  const opacity3 = useSharedValue(0.5);

  useEffect(() => {
    const delay2 = 150;
    const delay3 = 300;

    scale1.value = withRepeat(
      withSequence(
        withTiming(1.4, {
          duration: animationDuration / 2,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, {
          duration: animationDuration / 2,
          easing: Easing.in(Easing.ease),
        })
      ),
      -1,
      false
    );

    scale2.value = withDelay(
      delay2,
      withRepeat(
        withSequence(
          withTiming(1.4, {
            duration: animationDuration / 2,
            easing: Easing.out(Easing.ease),
          }),
          withTiming(1, {
            duration: animationDuration / 2,
            easing: Easing.in(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    scale3.value = withDelay(
      delay3,
      withRepeat(
        withSequence(
          withTiming(1.4, {
            duration: animationDuration / 2,
            easing: Easing.out(Easing.ease),
          }),
          withTiming(1, {
            duration: animationDuration / 2,
            easing: Easing.in(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    opacity1.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: animationDuration / 2,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(0.5, {
          duration: animationDuration / 2,
          easing: Easing.in(Easing.ease),
        })
      ),
      -1,
      false
    );

    opacity2.value = withDelay(
      delay2,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: animationDuration / 2,
            easing: Easing.out(Easing.ease),
          }),
          withTiming(0.5, {
            duration: animationDuration / 2,
            easing: Easing.in(Easing.ease),
          })
        ),
        -1,
        false
      )
    );

    opacity3.value = withDelay(
      delay3,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: animationDuration / 2,
            easing: Easing.out(Easing.ease),
          }),
          withTiming(0.5, {
            duration: animationDuration / 2,
            easing: Easing.in(Easing.ease),
          })
        ),
        -1,
        false
      )
    );
  }, [scale1, scale2, scale3, opacity1, opacity2, opacity3, animationDuration]);

  const dot1Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale1.value }],
      opacity: opacity1.value,
    };
  });

  const dot2Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale2.value }],
      opacity: opacity2.value,
    };
  });

  const dot3Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale3.value }],
      opacity: opacity3.value,
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
