'use client';

import React, { useCallback, useState, useId } from 'react';
import { motion, useMotionValue, animate } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { useUIConfig } from "@/hooks/use-ui-config";
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaFormFieldAttributes } from '@/lib/accessibility';

export interface PremiumSliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showSteps?: boolean;
  gradientTrack?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
  'aria-label': string;
}

export function PremiumSlider({
  value = [0],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  size = 'md',
  showValue = false,
  showSteps = false,
  gradientTrack = false,
  disabled = false,
  label,
  className,
  'aria-label': ariaLabel,
}: PremiumSliderProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const [isDragging, setIsDragging] = useState(false);
  const tooltipOpacity = useMotionValue(0);
  const tooltipScale = useMotionValue(0.8);

  const currentValue = value[0] ?? min;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const tooltipVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      },
    },
  };

  const handleValueChange = useCallback(
    (newValue: number[]) => {
      if (disabled) return;
      onValueChange?.(newValue);
      haptics.impact('light');
    },
    [disabled, onValueChange]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    animate(tooltipOpacity, 1, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(tooltipScale, 1, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [tooltipOpacity, tooltipScale]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    animate(tooltipOpacity, 0, {
      duration: 0.2,
      ease: 'easeInOut',
    });
    animate(tooltipScale, 0.8, {
      duration: 0.2,
      ease: 'easeInOut',
    });
  }, [tooltipOpacity, tooltipScale]);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const thumbSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const generatedId = useId();
  const sliderId = `${generatedId}-slider`;
  const labelId = label ? `${sliderId}-label` : undefined;

  return (
    <div className={cn('w-full', className)}>
      {(label ?? showValue) && (
        <div className={cn(
          'flex items-center justify-between',
          getSpacingClassesFromConfig({ marginY: 'sm' })
        )}>
          {label && (
            <label
              id={labelId}
              htmlFor={sliderId}
              className={cn(
                'text-foreground',
                getTypographyClasses('caption')
              )}
            >
              {label}
            </label>
          )}
          {showValue && (
            <span className={cn(
              'text-muted-foreground',
              getTypographyClasses('caption')
            )}>
              {currentValue}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <SliderPrimitive.Root
          id={sliderId}
          value={value}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="relative flex w-full touch-none select-none items-center"
          {...getAriaFormFieldAttributes({
            label: ariaLabel,
            labelledBy: labelId,
            disabled,
          })}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentValue}
          onPointerDown={handleDragStart}
          onPointerUp={handleDragEnd}
        >
          <SliderPrimitive.Track
            className={cn(
              'relative w-full grow overflow-hidden rounded-full bg-muted',
              sizes[size]
            )}
          >
            <SliderPrimitive.Range
              className={cn(
                'absolute h-full',
                gradientTrack
                  ? 'bg-linear-to-r from-primary via-primary/80 to-primary'
                  : 'bg-primary'
              )}
              style={{ width: `${String(percentage ?? '')}%` }}
            />
          </SliderPrimitive.Track>

          {showSteps && (
            <div className="absolute inset-0 flex items-center justify-between px-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-0.5 h-2 bg-muted-foreground/30 rounded-full" />
              ))}
            </div>
          )}

          {value.map((val, index) => (
            <SliderPrimitive.Thumb
              key={index}
              className={cn(
                'block rounded-full border-2 border-primary bg-background shadow-lg',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2',
                'hover:scale-110 active:scale-95',
                disabled && 'cursor-not-allowed opacity-50',
                thumbSizes[size]
              )}
            >
              {isDragging && (
                <motion.div
                  variants={tooltipVariants}
                  animate="visible"
                  initial="hidden"
                  style={{
                    opacity: tooltipOpacity,
                    scale: tooltipScale,
                  }}
                  className={cn(
                    'absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background rounded shadow-lg whitespace-nowrap',
                    getTypographyClasses('caption'),
                    getSpacingClassesFromConfig({ paddingX: 'sm', paddingY: 'xs' })
                  )}
                  role="tooltip"
                  aria-hidden="true"
                >
                  {val}
                </motion.div>
              )}
            </SliderPrimitive.Thumb>
          ))}
        </SliderPrimitive.Root>
      </div>
    </div>
  );
}
