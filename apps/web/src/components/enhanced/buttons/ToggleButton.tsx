'use client';

import React, { useCallback, useEffect } from 'react';
import { motion, useMotionValue, type Variants } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaButtonAttributes } from '@/lib/accessibility';

const logger = createLogger('ToggleButton');

export interface ToggleButtonProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
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
  style: _style,
  ...props
}: ToggleButtonProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const scale = useMotionValue(checked ? 1 : 0.95);
  const opacity = useMotionValue(checked ? 1 : 0.7);

  useEffect(() => {
    scale.set(checked ? 1 : 0.95);
    opacity.set(checked ? 1 : 0.7);
  }, [checked, scale, opacity]);

  const variants: Variants = {
    unchecked: {
      scale: 0.95,
      opacity: 0.7,
    },
    checked: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: springConfigs.bouncy.damping,
        stiffness: springConfigs.bouncy.stiffness,
      },
    },
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;

      try {
        const newChecked = !checked;
        onChange?.(newChecked);
        haptics.selection();
        onClick?.(e);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('ToggleButton onClick error', err);
      }
    },
    [checked, disabled, onChange, onClick]
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
    sm: cn(
      getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' }),
      getTypographyClasses('button'),
      'min-h-11'
    ),
    md: cn(
      getSpacingClassesFromConfig({ paddingX: 'lg', paddingY: 'sm' }),
      getTypographyClasses('button'),
      'min-h-11'
    ),
    lg: cn(
      getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'md' }),
      getTypographyClasses('button'),
      'min-h-11'
    ),
  };

  const toggleAria = getAriaButtonAttributes({
    label: ariaLabel,
    pressed: checked,
    disabled,
  });

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      variants={variants}
      animate={checked ? 'checked' : 'unchecked'}
      style={{ scale, opacity }}
      className={cn(
        'relative overflow-hidden rounded-xl',
        'transition-all duration-300',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        variantStyles[variant],
        sizes[size],
        className
      )}
      {...toggleAria}
      {...props}
    >
      {children}
    </motion.button>
  );
}
