'use client';

import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface PremiumChipProps {
  label: string;
  variant?: 'default' | 'outlined' | 'filled' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  onClose?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label': string;
}

export function PremiumChip({
  label,
  variant = 'default',
  size = 'md',
  icon,
  onClose,
  selected = false,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: PremiumChipProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  })) as AnimatedStyle;

  const handleClose = useCallback(() => {
    if (disabled || !onClose) return;

    scale.value = withSpring(0.8, springConfigs.smooth);
    opacity.value = withTiming(0, { duration: 200 });
    haptics.impact('light');

    setTimeout(() => {
      onClose();
    }, 200);
  }, [disabled, onClose, scale, opacity]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    haptics.selection();
  }, [disabled]);

  const variants = {
    default: selected
      ? 'bg-primary text-primary-foreground border-primary'
      : 'bg-muted text-muted-foreground border-muted',
    outlined: selected
      ? 'bg-transparent text-primary border-2 border-primary'
      : 'bg-transparent text-foreground border-2 border-border',
    filled: selected
      ? 'bg-primary text-primary-foreground border-transparent'
      : 'bg-muted text-muted-foreground border-transparent',
    gradient: selected
      ? 'bg-linear-to-r from-primary via-primary/80 to-primary text-primary-foreground border-transparent'
      : 'bg-muted text-muted-foreground border-muted',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs h-6',
    md: 'px-3 py-1 text-sm h-8',
    lg: 'px-4 py-1.5 text-base h-10',
  };

  return (
    <AnimatedView style={animatedStyle}>
      <div
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size],
          selected && 'shadow-md',
          className
        )}
        role={onClose ? 'button' : undefined}
        aria-label={ariaLabel}
        aria-selected={selected}
        aria-disabled={disabled}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{label}</span>
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            disabled={disabled}
            className="ml-1 opacity-70 hover:opacity-100 transition-opacity shrink-0"
            aria-label="Remove chip"
          >
            <X size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
          </button>
        )}
      </div>
    </AnimatedView>
  );
}
