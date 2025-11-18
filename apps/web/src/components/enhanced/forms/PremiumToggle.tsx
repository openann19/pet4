'use client';

import React, { useCallback, useEffect } from 'react';
import { motion, useMotionValue, animate } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaButtonAttributes } from '@/lib/accessibility';

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
  const _uiConfig = useUIConfig();
  const thumbPosition = useMotionValue(checked ? 1 : 0);
  const glowOpacity = useMotionValue(checked ? 1 : 0);

  useEffect(() => {
    const config = SIZE_CONFIG[size];
    const _maxTranslate = config.width - config.thumb - 4;
    animate(thumbPosition, checked ? 1 : 0, {
      type: 'spring',
      damping: springConfigs.bouncy.damping,
      stiffness: springConfigs.bouncy.stiffness,
    });
    animate(glowOpacity, checked ? 1 : 0, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [checked, thumbPosition, glowOpacity, size]);

  const config = SIZE_CONFIG[size];
  const maxTranslate = config.width - config.thumb - 4;

  const thumbVariants: Variants = {
    off: {
      x: 0,
    },
    on: {
      x: maxTranslate,
      transition: {
        type: 'spring',
        damping: springConfigs.bouncy.damping,
        stiffness: springConfigs.bouncy.stiffness,
      },
    },
  };

  const trackVariants: Variants = {
    off: {
      backgroundColor: 'var(--muted)',
    },
    on: {
      backgroundColor: 'var(--primary)',
      transition: {
        duration: 0.3,
      },
    },
  };

  const glowVariants: Variants = {
    off: {
      opacity: 0,
      boxShadow: '0 0 0px rgba(59, 130, 246, 0)',
    },
    on: {
      opacity: 1,
      boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)',
      transition: {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      },
    },
  };

  const handleToggle = useCallback(() => {
    if (disabled) return;

    const newChecked = !checked;
    onCheckedChange?.(newChecked);
    haptics.impact('light');
  }, [checked, disabled, onCheckedChange]);

  const toggleAriaAttrs = getAriaButtonAttributes({
    label: ariaLabel,
    pressed: checked,
    disabled,
  });

  return (
    <div className={cn(
      'flex items-center',
      getSpacingClassesFromConfig({ gap: 'md' }),
      className
    )}>
      <button
        type="button"
        onClick={() => void handleToggle()}
        disabled={disabled}
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
        {...toggleAriaAttrs}
        aria-checked={checked}
      >
        <motion.div
          variants={trackVariants}
          animate={checked ? 'on' : 'off'}
          className="absolute inset-0 rounded-full"
        />
        <motion.div
          variants={glowVariants}
          animate={checked ? 'on' : 'off'}
          className="absolute inset-0 rounded-full"
        />
        <motion.div
          variants={thumbVariants}
          animate={checked ? 'on' : 'off'}
          style={{
            width: config.thumb,
            height: config.thumb,
          }}
          className={cn(
            'absolute top-0.5 rounded-full bg-white shadow-lg',
            'transition-all duration-300'
          )}
        />
      </button>
      {label && (
        <label
          onClick={() => void handleToggle()}
          htmlFor={undefined}
          className={cn(
            getTypographyClasses('caption'),
            'cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
