'use client';;
import React, { useCallback } from 'react';
import { useSharedValue, withSpring, animate, motion, type AnimatedStyle, type MotionView as MotionViewType } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

export interface PremiumAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: AvatarStatus;
  badge?: number | string;
  variant?: 'default' | 'ring' | 'glow';
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

const SIZE_CONFIG = {
  sm: { size: 32, ring: 2, status: 8 },
  md: { size: 48, ring: 3, status: 10 },
  lg: { size: 64, ring: 4, status: 12 },
  xl: { size: 96, ring: 5, status: 16 },
} as const;

const STATUS_COLORS: Record<AvatarStatus, string> = {
  online: 'bg-(--success)',
  offline: 'bg-(--text-muted)',
  away: 'bg-(--warning)',
  busy: 'bg-(--danger)',
};

export function PremiumAvatar({
  src,
  alt,
  fallback,
  size = 'md',
  status,
  badge,
  variant = 'default',
  onClick,
  className,
  'aria-label': ariaLabel,
}: PremiumAvatarProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.get(),
  }));

  const handleMouseEnter = useCallback(() => {
    if (prefersReducedMotion) return;
    const scaleTransition = withSpring(1.05, springConfigs.smooth);
    animate(scale, scaleTransition.target, scaleTransition.transition);
    if (variant === 'glow') {
      const glowTransition = withSpring(1, springConfigs.smooth);
      animate(glowOpacity, glowTransition.target, glowTransition.transition);
    }
  }, [scale, glowOpacity, variant, prefersReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    if (prefersReducedMotion) return;
    const scaleTransition = withSpring(1, springConfigs.smooth);
    animate(scale, scaleTransition.target, scaleTransition.transition);
    const glowTransition = withSpring(0, springConfigs.smooth);
    animate(glowOpacity, glowTransition.target, glowTransition.transition);
  }, [scale, glowOpacity, prefersReducedMotion]);

  const handleClick = useCallback(() => {
    if (onClick) {
      haptics.impact('light');
      onClick();
    }
  }, [onClick]);

  const handleLongPress = useCallback(() => {
    if (variant === 'glow') {
      const glowTransition1 = withSpring(1, springConfigs.smooth);
      animate(glowOpacity, glowTransition1.target, glowTransition1.transition);
      setTimeout(() => {
        const glowTransition2 = withSpring(0, springConfigs.smooth);
        animate(glowOpacity, glowTransition2.target, glowTransition2.transition);
      }, 500);
    }
    haptics.impact('medium');
  }, [variant, glowOpacity]);

  const config = SIZE_CONFIG[size];

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => void handleClick()}
      onContextMenu={handleLongPress}
      role={onClick ? 'button' : 'img'}
      aria-label={ariaLabel ?? alt}
    >
      {variant === 'ring' && (
        <div
          className="absolute inset-0 rounded-full border-2 border-(--primary)"
          style={{
            width: config.size + config.ring * 2,
            height: config.size + config.ring * 2,
            top: -config.ring,
            left: -config.ring,
          }}
        />
      )}
      {variant === 'glow' && (
        <MotionView
          style={{
            ...(glowStyle),
            position: 'absolute',
            width: config.size + 8,
            height: config.size + 8,
            top: -4,
            left: -4,
            borderRadius: '50%',
          }}
          className="bg-(--primary)/30 blur-md"
        >
          <div />
        </MotionView>
      )}
      <MotionView style={animatedStyle}>
        <Avatar
          className={cn(
            'relative overflow-hidden shadow-lg',
            onClick && cn(
              'cursor-pointer',
              prefersReducedMotion ? '' : 'transition-shadow duration-200 hover:shadow-xl'
            )
          )}
          style={{
            width: config.size,
            height: config.size,
          }}
        >
          <AvatarImage src={src} alt={alt} />
          <AvatarFallback className="bg-(--surface) text-(--text-muted) font-semibold">
            {fallback ?? '?'}
          </AvatarFallback>
        </Avatar>
      </MotionView>
      {status && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-(--background)',
            STATUS_COLORS[status]
          )}
          style={{
            width: config.status,
            height: config.status,
            minWidth: '8px',
            minHeight: '8px',
          }}
        />
      )}
      {badge !== undefined && (
        <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] min-h-[20px] px-1 bg-(--danger) text-(--primary-foreground) text-xs font-bold rounded-full border-2 border-(--background) shadow-lg">
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </div>
      )}
    </div>
  );
}
