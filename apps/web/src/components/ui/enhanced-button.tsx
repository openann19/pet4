'use client';

import type { ReactNode, ButtonHTMLAttributes, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { AnimatedView, useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

const logger = createLogger('EnhancedButton');

export interface EnhancedButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  enableHoverLift?: boolean;
  enableBounceOnTap?: boolean;
  enableGlow?: boolean;
  glowColor?: string;
  loading?: boolean;
  hapticFeedback?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export function EnhancedButton({
  children,
  variant = 'default',
  size = 'default',
  enableHoverLift = true,
  enableBounceOnTap = true,
  enableGlow = false,
  glowColor,
  loading = false,
  hapticFeedback = true,
  icon,
  iconPosition = 'left',
  className,
  onClick,
  disabled,
  ...props
}: EnhancedButtonProps): React.JSX.Element {
  const reducedMotion = usePrefersReducedMotion();
  const hoverLift = useHoverLift({
    scale: reducedMotion ? 1 : 1.05,
    translateY: reducedMotion ? 0 : -4,
  });
  const bounceOnTap = useBounceOnTap({
    scale: reducedMotion ? 1 : 0.96,
    hapticFeedback: false,
  });

  // Glow effect
  const glowOpacity = useSharedValue(0);
  const glowProgress = useSharedValue(0);

  // Loading spinner rotation
  const loadingRotation = useSharedValue(0);

  // Combined animation style
  const combinedAnimatedStyle = useAnimatedStyle(() => {
    const hoverScale = enableHoverLift ? hoverLift.scale.value : 1;
    const tapScale = enableBounceOnTap ? bounceOnTap.scale.value : 1;
    const hoverY = enableHoverLift ? hoverLift.translateY.value : 0;

    return {
      transform: [{ scale: hoverScale * tapScale }, { translateY: hoverY }],
    };
  }) as AnimatedStyle;

  // Glow animation style
  const glowAnimatedStyle = useAnimatedStyle(() => {
    if (!enableGlow) {
      return { opacity: 0 };
    }

    const opacity = interpolate(
      glowProgress.value,
      [0, 0.5, 1],
      [0.3, 0.6, 0.3],
      Extrapolation.CLAMP
    );

    return {
      opacity: glowOpacity.value * opacity,
    };
  }) as AnimatedStyle;

  // Loading spinner animation
  useEffect(() => {
    if (loading) {
      loadingRotation.value = withRepeat(
        withTiming(360, {
          duration: 1000,
          easing: (t) => t,
        }),
        -1,
        false
      );
    } else {
      loadingRotation.value = withTiming(0, { duration: 0 });
    }
  }, [loading, loadingRotation]);

  const loadingSpinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${loadingRotation.value}deg` }],
    };
  }) as AnimatedStyle;

  // Start glow animation when enabled
  useEffect(() => {
    if (enableGlow && !reducedMotion) {
      glowProgress.value = withRepeat(
        withTiming(1, {
          duration: 2000,
          easing: (t) => t,
        }),
        -1,
        true
      );
      glowOpacity.value = withSpring(1, springConfigs.smooth);
    } else {
      glowOpacity.value = withTiming(0, timingConfigs.fast);
      glowProgress.value = 0;
    }
  }, [enableGlow, reducedMotion, glowOpacity, glowProgress]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) {
        return;
      }

      try {
        if (hapticFeedback) {
          haptics.impact('light');
        }

        if (enableBounceOnTap) {
          bounceOnTap.handlePress();
        }

        // Trigger glow pulse on click
        if (enableGlow && !reducedMotion) {
          glowOpacity.value = withSequence(
            withSpring(1, springConfigs.bouncy),
            withSpring(0.6, springConfigs.smooth)
          );
        }

        onClick?.(e);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('EnhancedButton onClick error', err, { variant, size });
      }
    },
    [
      disabled,
      loading,
      hapticFeedback,
      enableBounceOnTap,
      enableGlow,
      reducedMotion,
      bounceOnTap,
      glowOpacity,
      onClick,
      variant,
      size,
    ]
  );

  const handleMouseEnter = useCallback(() => {
    if (disabled || loading || reducedMotion) {
      return;
    }

    if (enableHoverLift) {
      hoverLift.handleEnter();
    }

    if (enableGlow) {
      glowOpacity.value = withSpring(1, springConfigs.smooth);
    }
  }, [disabled, loading, reducedMotion, enableHoverLift, enableGlow, hoverLift, glowOpacity]);

  const handleMouseLeave = useCallback(() => {
    if (disabled || loading || reducedMotion) {
      return;
    }

    if (enableHoverLift) {
      hoverLift.handleLeave();
    }

    if (enableGlow) {
      glowOpacity.value = withSpring(0.3, springConfigs.smooth);
    }
  }, [disabled, loading, reducedMotion, enableHoverLift, enableGlow, hoverLift, glowOpacity]);

  // Variant styles using design tokens
  const variantClasses = useMemo(() => {
    const variants = {
      default:
        'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] shadow-lg hover:shadow-xl disabled:bg-[var(--btn-primary-disabled-bg)] disabled:text-[var(--btn-primary-disabled-fg)] disabled:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)] focus-visible:ring-offset-2',
      destructive:
        'bg-[var(--btn-destructive-bg)] text-[var(--btn-destructive-fg)] shadow-lg hover:shadow-xl disabled:bg-[var(--btn-destructive-disabled-bg)] disabled:text-[var(--btn-destructive-disabled-fg)] disabled:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--btn-destructive-focus-ring)] focus-visible:ring-offset-2',
      outline:
        'border-[1.5px] border-[var(--btn-outline-border)] bg-[var(--btn-outline-bg)] text-[var(--btn-outline-fg)] shadow-sm hover:shadow-lg hover:bg-[var(--btn-outline-hover-bg)] hover:text-[var(--btn-outline-hover-fg)] hover:border-[var(--btn-outline-hover-border)] disabled:bg-[var(--btn-outline-disabled-bg)] disabled:text-[var(--btn-outline-disabled-fg)] disabled:border-[var(--btn-outline-disabled-border)] disabled:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--btn-outline-focus-ring)] focus-visible:ring-offset-2',
      secondary:
        'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-fg)] shadow-lg hover:shadow-xl disabled:bg-[var(--btn-secondary-disabled-bg)] disabled:text-[var(--btn-secondary-disabled-fg)] disabled:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--btn-secondary-focus-ring)] focus-visible:ring-offset-2',
      ghost:
        'bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-fg)] hover:bg-[var(--btn-ghost-hover-bg)] hover:text-[var(--btn-ghost-hover-fg)] disabled:bg-[var(--btn-ghost-disabled-bg)] disabled:text-[var(--btn-ghost-disabled-fg)] focus-visible:ring-2 focus-visible:ring-[var(--btn-ghost-focus-ring)] focus-visible:ring-offset-2',
      link: 'text-[var(--btn-link-fg)] underline-offset-4 hover:underline hover:text-[var(--btn-link-hover-fg)] disabled:text-[var(--btn-link-disabled-fg)] disabled:no-underline bg-transparent focus-visible:ring-2 focus-visible:ring-[var(--btn-link-focus-ring)] focus-visible:ring-offset-2',
    };

    return variants[variant] ?? variants.default;
  }, [variant]);

  // Size styles
  const sizeClasses = useMemo(() => {
    const sizes = {
      default: 'h-11 px-4 py-2 text-sm min-h-[44px] min-w-[44px]',
      sm: 'h-9 px-3 py-1.5 text-sm rounded-md gap-1.5 min-h-[44px] min-w-[44px]',
      lg: 'h-14 px-6 py-3 text-base rounded-md min-h-[44px] min-w-[44px]',
      icon: 'size-11 min-w-[44px] min-h-[44px] p-0',
    };

    return sizes[size] ?? sizes.default;
  }, [size]);

  const combinedStyleValue = useAnimatedStyleValue(combinedAnimatedStyle);
  const glowStyleValue = useAnimatedStyleValue(glowAnimatedStyle);
  const loadingStyleValue = useAnimatedStyleValue(loadingSpinnerStyle);

  const isDisabled = disabled || loading;

  // Determine glow color based on variant
  const resolvedGlowColor = useMemo(() => {
    if (glowColor) {
      return glowColor;
    }

    const glowColors = {
      default: 'rgba(37, 99, 235, 0.4)',
      destructive: 'rgba(220, 38, 38, 0.4)',
      outline: 'rgba(100, 116, 139, 0.3)',
      secondary: 'rgba(100, 116, 139, 0.4)',
      ghost: 'rgba(100, 116, 139, 0.2)',
      link: 'rgba(37, 99, 235, 0.3)',
    };

    return glowColors[variant] ?? glowColors.default;
  }, [glowColor, variant]);

  return (
    <AnimatedView
      style={combinedStyleValue}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium',
          'disabled:pointer-events-none disabled:cursor-default',
          'outline-none',
          '[&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-5 shrink-0 [&_svg]:shrink-0',
          'relative overflow-hidden',
          variantClasses,
          sizeClasses,
          className
        )}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {enableGlow && (
          <div
            className="absolute inset-0 pointer-events-none rounded-md"
            style={{
              backgroundColor: resolvedGlowColor,
              ...glowStyleValue,
            }}
          />
        )}

        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <div
              className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
              style={loadingStyleValue}
              aria-hidden="true"
            />
          ) : (
            <>
              {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
              {children}
              {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
            </>
          )}
        </span>
      </button>
    </AnimatedView>
  );
}
