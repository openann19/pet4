'use client';

import { useCallback, type ButtonHTMLAttributes } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

const logger = createLogger('ToggleButton');

export interface ToggleButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
}

export function ToggleButton({
  checked = false,
  onChange,
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  ...props
}: ToggleButtonProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    const scale = useSharedValue(checked ? 1 : 0.95);
  const opacity = useSharedValue(checked ? 1 : 0.7);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  })) as AnimatedStyle;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      try {
        const newChecked = !checked;
        onChange?.(newChecked);

        if (newChecked) {
          scale.value = withSpring(1, springConfigs.bouncy);
          opacity.value = withSpring(1, springConfigs.smooth);
          haptics.selection();
        } else {
          scale.value = withSpring(0.95, springConfigs.smooth);
          opacity.value = withSpring(0.7, springConfigs.smooth);
          haptics.selection();
        }

        onClick?.(e);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('ToggleButton onClick error', err);
      }
    },
    [checked, disabled, onChange, onClick, scale, opacity]
  );

  const variantStyles = {
    primary: checked
      ? 'bg-(--btn-primary-bg) text-(--btn-primary-fg)'
      : 'bg-transparent text-(--btn-ghost-fg) border-2 border-(--btn-primary-bg)',
    secondary: checked
      ? 'bg-(--btn-secondary-bg) text-(--btn-secondary-fg)'
      : 'bg-transparent text-(--btn-ghost-fg) border-2 border-(--btn-secondary-bg)',
    accent: checked
      ? 'bg-(--btn-primary-bg) text-(--btn-primary-fg)'
      : 'bg-transparent text-(--btn-ghost-fg) border-2 border-(--btn-primary-bg)',
    ghost: checked
      ? 'bg-(--btn-ghost-hover-bg) text-(--btn-ghost-fg)'
      : 'bg-transparent text-(--btn-ghost-fg)',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-11',
    md: 'px-4 py-2 text-base min-h-11',
    lg: 'px-6 py-3 text-lg min-h-11',
  };

  return (
    <AnimatedView style={animatedStyle}>
      <button
        onClick={handleClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={checked}
        className={cn(
          'relative overflow-hidden rounded-xl font-semibold',
          'transition-all duration-300',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          variantStyles[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    </AnimatedView>
  );
}
