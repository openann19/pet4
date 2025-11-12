'use client';

import { useMemo, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useGlowPulse } from '@/effects/reanimated';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

const logger = createLogger('GlowingBadge');

export type GlowingBadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning';

export interface GlowingBadgeProps {
  children: React.ReactNode;
  variant?: GlowingBadgeVariant;
  glow?: boolean;
  pulse?: boolean;
  className?: string;
  'aria-label'?: string;
}

const VARIANT_STYLES: Record<GlowingBadgeVariant, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
  success: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400',
};

const VARIANT_GLOW_COLORS: Record<GlowingBadgeVariant, string> = {
  primary: 'rgba(var(--primary), 0.6)',
  secondary: 'rgba(var(--secondary), 0.6)',
  accent: 'rgba(var(--accent), 0.6)',
  success: 'rgba(34, 197, 94, 0.6)',
  warning: 'rgba(234, 179, 8, 0.6)',
};

export function GlowingBadge({
  children,
  variant = 'primary',
  glow = true,
  pulse = false,
  className,
  'aria-label': ariaLabel,
}: GlowingBadgeProps): JSX.Element {
    const _uiConfig = useUIConfig();
    const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.5);

  const glowPulse = useGlowPulse({
    duration: 2000,
    intensity: 0.4,
    enabled: glow,
    color: VARIANT_GLOW_COLORS[variant],
  });

  useEffect(() => {
    try {
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to initialize badge animation', err, { variant });
    }
  }, [scale, opacity, variant]);

  useEffect(() => {
    if (isTruthy(pulse)) {
      try {
        pulseOpacity.value = withRepeat(
          withSequence(withTiming(1, { duration: 1000 }), withTiming(0.5, { duration: 1000 })),
          -1,
          true
        );
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to initialize pulse animation', err, { variant });
      }
    } else {
      pulseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [pulse, pulseOpacity, variant]);

  const badgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  const pulseStyle = useAnimatedStyle(() => {
    const opacityValue = interpolate(pulseOpacity.value, [0.5, 1], [0.5, 1], Extrapolation.CLAMP);
    return {
      opacity: opacityValue,
    };
  }) as AnimatedStyle;

  const variantStyles = useMemo<string>(() => VARIANT_STYLES[variant], [variant]);

  const combinedStyle = useMemo(() => {
    if (isTruthy(glow)) {
      return {
        ...badgeStyle,
        ...glowPulse.animatedStyle,
      };
    }
    return badgeStyle;
  }, [badgeStyle, glow, glowPulse.animatedStyle]);

  return (
    <AnimatedView
      style={combinedStyle}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full',
        'text-xs font-semibold border backdrop-blur-sm',
        variantStyles,
        className
      )}
      role="status"
      aria-label={ariaLabel}
    >
      {pulse && (
        <AnimatedView
          style={pulseStyle}
          className="w-2 h-2 rounded-full bg-current"
          role="presentation"
          aria-hidden="true"
        >
          <span className="sr-only">Pulsing indicator</span>
        </AnimatedView>
      )}
      {children}
    </AnimatedView>
  );
}
