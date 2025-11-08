'use client';

import type { ComponentProps, MouseEvent } from 'react';
import { forwardRef, useRef, useCallback } from 'react';
import type { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { MotionView } from '@petspark/motion';
import { usePressBounce, haptic } from '@petspark/motion';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';

const logger = createLogger('EnhancedButton');

export interface EnhancedButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  ripple?: boolean;
  hapticFeedback?: boolean;
  successAnimation?: boolean;
  asChild?: boolean;
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      ripple = true,
      hapticFeedback = true,
      successAnimation = false,
      onClick,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const bounceAnimation = usePressBounce(0.95);
    const successScale = useSharedValue(1);
    const errorShake = useSharedValue(0);

    const isPromise = useCallback((value: unknown): value is Promise<unknown> => {
      return (
        value != null &&
        typeof value === 'object' &&
        'then' in value &&
        typeof (value as Promise<unknown>).then === 'function'
      );
    }, []);

    const successAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: successScale.value }],
      };
    }) as AnimatedStyle;

    const errorAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: errorShake.value }],
      };
    }) as AnimatedStyle;

    useEffect(() => {
      // Reset success scale when component mounts
      successScale.value = 1;
    }, [successScale]);

    const handleClick = useCallback(
      async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
        try {
          if (hapticFeedback) {
            haptic.light();
          }

          bounceAnimation.onPressIn();

          if (onClick) {
            const result = onClick(e);

            if (isPromise(result)) {
              await result;

              if (successAnimation) {
                successScale.value = withSequence(
                  withSpring(1.1, springConfigs.bouncy),
                  withSpring(1, springConfigs.smooth)
                );
                if (hapticFeedback) {
                  haptic.medium();
                }
                logger.info('Button action succeeded', { successAnimation: true });
              }
            }
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          errorShake.value = withSequence(
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(0, { duration: 50 })
          );
          if (hapticFeedback) {
            haptic.heavy();
          }
          logger.error('Button action failed', err);
        } finally {
          bounceAnimation.onPressOut();
        }
      },
      [
        hapticFeedback,
        successAnimation,
        onClick,
        bounceAnimation,
        successScale,
        errorShake,
        isPromise,
      ]
    );

    return (
      <MotionView animatedStyle={successAnimatedStyle} className="relative">
        <MotionView animatedStyle={errorAnimatedStyle} className="relative">
          <MotionView animatedStyle={bounceAnimation.animatedStyle} className="relative">
            <div className="relative overflow-hidden">
              <Button
                ref={ref || buttonRef}
                onClick={handleClick}
                className={cn(
                  'relative overflow-hidden transition-all duration-300',
                  'hover:shadow-lg hover:-translate-y-0.5',
                  'active:translate-y-0 active:shadow-md',
                  className
                )}
                {...props}
              >
                {children}
              </Button>
            </div>
          </MotionView>
        </MotionView>
      </MotionView>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';
