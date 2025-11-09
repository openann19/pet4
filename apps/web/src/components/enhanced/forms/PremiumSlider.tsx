'use client';

import { useCallback, useState } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import * as SliderPrimitive from '@radix-ui/react-slider';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

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
    const uiConfig = useUIConfig();
    const [isDragging, setIsDragging] = useState(false);
  const tooltipOpacity = useSharedValue(0);
  const tooltipScale = useSharedValue(0.8);

  const currentValue = value[0] ?? min;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ scale: tooltipScale.value }],
  })) as AnimatedStyle;

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
    tooltipOpacity.value = withSpring(1, springConfigs.smooth);
    tooltipScale.value = withSpring(1, springConfigs.smooth);
  }, [tooltipOpacity, tooltipScale]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    tooltipOpacity.value = withTiming(0, { duration: 200 });
    tooltipScale.value = withTiming(0.8, { duration: 200 });
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

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <label className="text-sm font-medium text-foreground">{label}</label>}
          {showValue && <span className="text-sm text-muted-foreground">{currentValue}</span>}
        </div>
      )}

      <div className="relative">
        <SliderPrimitive.Root
          value={value}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="relative flex w-full touch-none select-none items-center"
          aria-label={ariaLabel}
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
              style={{ width: `${percentage}%` }}
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
                <AnimatedView
                  style={tooltipStyle}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-foreground text-background text-xs rounded shadow-lg whitespace-nowrap"
                >
                  <div>{val}</div>
                </AnimatedView>
              )}
            </SliderPrimitive.Thumb>
          ))}
        </SliderPrimitive.Root>
      </div>
    </div>
  );
}
