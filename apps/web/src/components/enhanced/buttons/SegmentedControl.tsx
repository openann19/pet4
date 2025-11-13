'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import { motion, useMotionValue, animate, type Variants } from 'framer-motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";
import { isTruthy } from '@petspark/shared';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';

export interface SegmentedControlOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiSelect?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label': string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  multiSelect = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: SegmentedControlProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorPosition = useMotionValue(0);
  const indicatorWidth = useMotionValue(0);
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const updateIndicator = useCallback(() => {
    if (!containerRef.current || options.length === 0) return;

    const container = containerRef.current;
    const buttons = container.querySelectorAll('button[data-segment]');
    const selectedIndex = options.findIndex((opt) => selectedValues.includes(opt.value));

    if (selectedIndex >= 0 && buttons[selectedIndex]) {
      const selectedButton = buttons[selectedIndex] as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = selectedButton.getBoundingClientRect();

      const newPosition = buttonRect.left - containerRect.left;
      const newWidth = buttonRect.width;

      if (prefersReducedMotion) {
        indicatorPosition.set(newPosition);
        indicatorWidth.set(newWidth);
      } else {
        animate(indicatorPosition, newPosition, {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        });
        animate(indicatorWidth, newWidth, {
          type: 'spring',
          damping: springConfigs.smooth.damping,
          stiffness: springConfigs.smooth.stiffness,
        });
      }
    }
  }, [options, selectedValues, indicatorPosition, indicatorWidth, prefersReducedMotion]);

  useEffect(() => {
    updateIndicator();
    const resizeObserver = new ResizeObserver(updateIndicator);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [updateIndicator]);

  const indicatorVariants: Variants = prefersReducedMotion
    ? {
        animate: {
          x: indicatorPosition,
          width: indicatorWidth,
          transition: { duration: 0 },
        },
      }
    : {
        animate: {
          x: indicatorPosition,
          width: indicatorWidth,
          transition: {
            type: 'spring',
            damping: springConfigs.smooth.damping,
            stiffness: springConfigs.smooth.stiffness,
          },
        },
      };

  const handleOptionClick = useCallback(
    (optionValue: string) => {
      if (isTruthy(multiSelect)) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onChange?.(newValues);
      } else {
        onChange?.(optionValue);
      }
      haptics.selection();
      setTimeout(updateIndicator, 0);
    },
    [multiSelect, selectedValues, onChange, updateIndicator]
  );

  const sizes = {
    sm: cn('px-2 py-1 min-h-[44px]', getTypographyClasses('caption')),
    md: cn('px-3 py-1.5 min-h-[44px]', getTypographyClasses('body')),
    lg: cn('px-4 py-2 min-h-[44px]', getTypographyClasses('body')),
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex rounded-xl bg-(--surface) p-1',
        'border border-(--border)',
        className
      )}
    >
      <motion.div
        variants={indicatorVariants}
        animate="animate"
        style={{
          x: indicatorPosition,
          width: indicatorWidth,
        }}
        className={cn(
          'absolute top-1 bottom-1 bg-(--background) rounded-lg shadow-sm',
          prefersReducedMotion ? '' : 'transition-all duration-200'
        )}
      />
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value);
        return (
          <button
            key={option.value}
            data-segment
            onClick={() => { handleOptionClick(option.value); }}
            role="tab"
            aria-selected={isSelected}
            className={cn(
              'relative z-10 flex items-center justify-center rounded-lg font-medium',
              prefersReducedMotion ? '' : 'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
              getSpacingClassesFromConfig({ gap: 'sm' }),
              sizes[size],
              isSelected ? 'text-(--text-primary)' : 'text-(--text-muted) hover:text-(--text-primary)'
            )}
          >
            {option.icon && <span aria-hidden="true">{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
