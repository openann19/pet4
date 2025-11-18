'use client';

import type { ComponentProps, MouseEvent } from 'react';
import { forwardRef, useRef, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
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
  animate,
} from '@petspark/motion';
import { useEffect } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';

const logger = createLogger('EnhancedButton');

export interface EnhancedButtonProps extends Omit<ComponentProps<'button'>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link' | 'default';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'default';
  ripple?: boolean;
  hapticFeedback?: boolean;
  successAnimation?: boolean;
  asChild?: boolean;
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      _ripple = true,
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
        transform: [{ scale: successScale.get() }],
      };
    });

    const errorAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: errorShake.get() }],
      };
    });

    useEffect(() => {
      // Reset success scale when component mounts
      animate(successScale, 1, { type: 'tween', duration: 0 });
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
                const sequence = withSequence(
                  withSpring(1.1, springConfigs.bouncy),
                  withSpring(1, springConfigs.smooth)
                );
                animate(successScale, sequence.target, sequence.transition);
                if (hapticFeedback) {
                  haptic.medium();
                }
                logger.info('Button action succeeded', { successAnimation: true });
              }
            }
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          const shakeSequence = withSequence(
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(0, { duration: 50 })
          );
          animate(errorShake, shakeSequence.target, shakeSequence.transition);
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
      <MotionView style={successAnimatedStyle} className="relative">
        <MotionView style={errorAnimatedStyle} className="relative">
          <MotionView style={bounceAnimation.animatedStyle as any} className="relative">
            <div className="relative overflow-hidden">
              <Button
                ref={ref ?? buttonRef}
                onClick={() => void handleClick()}
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
