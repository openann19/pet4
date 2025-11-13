'use client';

import React, { useEffect } from 'react';
import { motion, useMotionValue, animate, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface ShimmerEffectProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  animated?: boolean;
}

export function ShimmerEffect({
  width = '100%',
  height = '1rem',
  borderRadius = '0.5rem',
  className,
  animated = true,
}: ShimmerEffectProps) {
  const _uiConfig = useUIConfig();
  const shimmerPosition = useMotionValue(-100);

  useEffect(() => {
    if (animated) {
      animate(shimmerPosition, 200, {
        duration: 1.5,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      });
    }
  }, [animated, shimmerPosition]);

  const shimmerVariants: Variants = {
    shimmer: {
      x: [-100, 200],
      transition: {
        duration: 1.5,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
  };

  return (
    <div
      className={cn('relative overflow-hidden bg-muted rounded-lg', className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      }}
    >
      <motion.div
        variants={shimmerVariants}
        animate={animated ? 'shimmer' : undefined}
        style={{
          x: animated ? shimmerPosition : -100,
        }}
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent w-1/2"
      />
    </div>
  );
}
