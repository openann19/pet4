'use client';

import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface PremiumToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
  className?: string;
  'aria-label': string;
}

const SIZE_CONFIG = {
  sm: { width: 36, height: 20, thumb: 16 },
  md: { width: 44, height: 24, thumb: 20 },
  lg: { width: 52, height: 28, thumb: 24 },
} as const;

export function PremiumToggle({
  checked = false,
  onCheckedChange,
  size = 'md',
  disabled = false,
  label,
  className,
  'aria-label': ariaLabel,
}: PremiumToggleProps): React.JSX.Element {
  const thumbPosition = useSharedValue(checked ? 1 : 0);
  const glowOpacity = useSharedValue(checked ? 1 : 0);

  const thumbStyle = useAnimatedStyle(() => {
    const config = SIZE_CONFIG[size];
    const maxTranslate = config.width - config.thumb - 4;
    return {
      transform: [{ translateX: thumbPosition.value * maxTranslate }],
    };
  }) as AnimatedStyle;

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: checked ? 'var(--primary)' : 'var(--muted)',
  })) as AnimatedStyle;

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    boxShadow: `0 0 ${glowOpacity.value * 12}px rgba(59, 130, 246, ${glowOpacity.value * 0.6})`,
  })) as AnimatedStyle;

  const handleToggle = useCallback(() => {
    if (disabled) return;

    const newChecked = !checked;
    onCheckedChange?.(newChecked);

    thumbPosition.value = withSpring(newChecked ? 1 : 0, springConfigs.bouncy);
    glowOpacity.value = withSpring(newChecked ? 1 : 0, springConfigs.smooth);

    haptics.impact('light');
  }, [checked, disabled, onCheckedChange, thumbPosition, glowOpacity]);

  const config = SIZE_CONFIG[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-checked={checked}
        role="switch"
        className={cn(
          'relative rounded-full transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'active:scale-95'
        )}
        style={{
          width: config.width,
          height: config.height,
        }}
      >
        <AnimatedView style={[trackStyle, glowStyle]} className="absolute inset-0 rounded-full" />
        <AnimatedView
          style={thumbStyle}
          className={cn(
            'absolute top-0.5 rounded-full bg-white shadow-lg',
            'transition-all duration-300'
          )}
          style={{
            width: config.thumb,
            height: config.thumb,
          }}
        />
      </button>
      {label && (
        <label
          onClick={handleToggle}
          className={cn(
            'text-sm font-medium cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
