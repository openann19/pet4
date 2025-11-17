'use client';

import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { MotionView } from '@petspark/motion';

import { cn } from '@/lib/utils';
import { getSpacingClassesFromConfig } from '@/lib/typography';

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max]
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(value !== undefined ? { value } : {})}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none items-center select-none group',
        'data-disabled:opacity-50 data-disabled:cursor-not-allowed',
        'data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        getSpacingClassesFromConfig({ paddingY: 'lg' }),
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          'relative grow overflow-visible rounded-full',
          'bg-muted/70 backdrop-blur-sm',
          'shadow-inner shadow-border/20',
          'transition-all duration-300',
          'group-hover:bg-muted',
          'data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:w-full',
          'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5'
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            'absolute rounded-full',
            'bg-linear-to-r from-primary via-primary to-accent',
            'shadow-lg shadow-primary/30',
            'transition-all duration-300',
            'group-hover:shadow-xl group-hover:shadow-primary/30',
            'data-[orientation=horizontal]:h-full',
            'data-[orientation=vertical]:w-full',
            'relative overflow-hidden'
          )}
        >
          <MotionView
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 1,
            }}
            aria-hidden="true"
          />
        </SliderPrimitive.Range>
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            'block size-5 shrink-0 rounded-full',
            'border-2 border-primary/80',
            'bg-card',
            'shadow-xl shadow-primary/30',
            'transition-all duration-200 ease-out',
            'hover:scale-125 hover:shadow-2xl hover:shadow-primary/40 hover:border-primary/80',
            'active:scale-110 active:shadow-lg',
            'focus-visible:scale-125 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:shadow-2xl',
            'disabled:pointer-events-none disabled:opacity-50',
            'relative overflow-hidden',
            'cursor-grab active:cursor-grabbing'
          )}
        >
          <MotionView
            className="absolute inset-0 bg-primary/10 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            aria-hidden="true"
          />
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
