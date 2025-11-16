'use client';

import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { cn } from '@/lib/utils';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getTypographyClasses } from '@/lib/typography';

export interface PremiumProgressProps {
  value?: number;
  max?: number;
  variant?: 'default' | 'gradient' | 'striped';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
  'aria-label': string;
}

export function PremiumProgress({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = false,
  label,
  animated = true,
  className,
  'aria-label': ariaLabel,
}: PremiumProgressProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const progressWidth = useMotionValue(0);
  const shimmerX = useMotionValue(-100);
  const progressWidthPercent = useTransform(progressWidth, (v: number) => `${v}%`);
  const shimmerXPercent = useTransform(shimmerX, (v: number) => `${v}%`);

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  useEffect(() => {
    if (prefersReducedMotion) {
      progressWidth.set(percentage);
      return;
    }
    if (animated) {
      animate(progressWidth, percentage, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    } else {
      animate(progressWidth, percentage, {
        duration: 0.3,
        ease: 'easeInOut',
      });
    }
  }, [percentage, animated, progressWidth, prefersReducedMotion]);

  useEffect(() => {
    if (variant === 'striped' && !prefersReducedMotion) {
      animate(shimmerX, 200, {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      });
    } else {
      shimmerX.set(-100);
    }
  }, [variant, shimmerX, prefersReducedMotion]);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variants = {
    default: 'bg-(--primary)',
    gradient: 'bg-(--primary)',
    striped: 'bg-(--primary)',
  };

  return (
    <div className={cn('w-full', className)}>
      {(label ?? showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label className={cn(getTypographyClasses('caption'), 'text-(--text-primary)')}>
              {label}
            </label>
          )}
          {showValue && (
            <span className={cn(getTypographyClasses('caption'), 'text-(--text-muted)')}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <ProgressPrimitive.Root
        value={value}
        max={max}
        className={cn('relative w-full overflow-hidden rounded-full bg-(--surface)', sizes[size])}
        aria-label={ariaLabel}
      >
        <motion.div
          style={{
            width: prefersReducedMotion ? `${percentage}%` : progressWidthPercent,
            background: variant === 'gradient' ? 'linear-gradient(to right, var(--primary), var(--primary), var(--primary))' : undefined,
          }}
          className={cn(
            'h-full rounded-full',
            prefersReducedMotion ? '' : 'transition-all duration-300',
            variants[variant],
            variant === 'striped' && 'relative overflow-hidden'
          )}
        >
          {variant === 'striped' && !prefersReducedMotion && (
            <motion.div
              style={{
                background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent)',
                x: shimmerXPercent,
              }}
              className="absolute inset-0"
            />
          )}
        </motion.div>
      </ProgressPrimitive.Root>
    </div>
  );
}
