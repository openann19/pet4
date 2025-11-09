'use client';

import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

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
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
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
    const uiConfig = useUIConfig();
    const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  })) as AnimatedStyle;

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  })) as AnimatedStyle;

  const handleMouseEnter = useCallback(() => {
    scale.value = withSpring(1.05, springConfigs.smooth);
    if (variant === 'glow') {
      glowOpacity.value = withSpring(1, springConfigs.smooth);
    }
  }, [scale, glowOpacity, variant]);

  const handleMouseLeave = useCallback(() => {
    scale.value = withSpring(1, springConfigs.smooth);
    glowOpacity.value = withSpring(0, springConfigs.smooth);
  }, [scale, glowOpacity]);

  const handleClick = useCallback(() => {
    if (onClick) {
      haptics.impact('light');
      onClick();
    }
  }, [onClick]);

  const handleLongPress = useCallback(() => {
    if (variant === 'glow') {
      glowOpacity.value = withSpring(1, springConfigs.smooth);
      setTimeout(() => {
        glowOpacity.value = withSpring(0, springConfigs.smooth);
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
      onClick={handleClick}
      onContextMenu={handleLongPress}
      role={onClick ? 'button' : 'img'}
      aria-label={ariaLabel || alt}
    >
      {variant === 'ring' && (
        <div
          className="absolute inset-0 rounded-full border-2 border-primary"
          style={{
            width: config.size + config.ring * 2,
            height: config.size + config.ring * 2,
            top: -config.ring,
            left: -config.ring,
          }}
        />
      )}

      {variant === 'glow' && (
        <AnimatedView
          style={[
            glowStyle,
            {
              position: 'absolute',
              width: config.size + 8,
              height: config.size + 8,
              top: -4,
              left: -4,
              borderRadius: '50%',
            },
          ]}
          className="bg-primary/30 blur-md"
        >
          <div />
        </AnimatedView>
      )}

      <AnimatedView style={animatedStyle}>
        <Avatar
          className={cn(
            'relative overflow-hidden shadow-lg',
            onClick && 'cursor-pointer transition-shadow hover:shadow-xl'
          )}
          style={{
            width: config.size,
            height: config.size,
          }}
        >
          <AvatarImage src={src} alt={alt} />
          <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
            {fallback || '?'}
          </AvatarFallback>
        </Avatar>
      </AnimatedView>

      {status && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            STATUS_COLORS[status]
          )}
          style={{
            width: config.status,
            height: config.status,
          }}
        />
      )}

      {badge !== undefined && (
        <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-background shadow-lg">
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </div>
      )}
    </div>
  );
}
