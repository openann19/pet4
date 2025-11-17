import { useEffect, useMemo } from 'react';

// Web adapter using Framer Motion via façade
import { useMotionValue, animate, type MotionValue } from '@petspark/motion';

export interface ShimmerSweepOptions {
  width: number; // px width of the shimmering mask path
  duration?: number; // ms
  minOpacity?: number; // start opacity
  maxOpacity?: number; // peak opacity
  easing?: string; // Framer Motion easing function
}

export interface UseShimmerSweepReturn {
  x: MotionValue<number>;
  opacity: MotionValue<number>;
  progress: MotionValue<number>;
  isAnimating: boolean;
  variants: {
    shimmer: {
      x: MotionValue<number>;
      opacity: MotionValue<number>;
    };
    hidden: {
      opacity: number;
    };
    visible: {
      opacity: number;
    };
  };
  animatedStyle: { x: MotionValue<number>; opacity: MotionValue<number> };
}

export function useShimmerSweep({
  width,
  duration = 2000,
  minOpacity = 0.3,
  maxOpacity = 0.9,
  easing = 'linear',
}: ShimmerSweepOptions): UseShimmerSweepReturn {
  const progress = useMotionValue(0);
  const x = useMotionValue(-width);
  const opacity = useMotionValue(minOpacity);
  const isAnimating = useMemo(() => width > 0, [width]);

  useEffect(() => {
    if (width <= 0) {
      x.set(-width);
      opacity.set(minOpacity);
      return;
    }

    // Master progress animation using proper MotionValue animation
    const startTime = performance.now();
    let animationId: number;
    
    const updateAnimation = () => {
      const elapsed = performance.now() - startTime;
      const cycleDuration = duration;
      const progressValue = (elapsed % cycleDuration) / cycleDuration;
      
      // Apply easing function if it's a string
      let easedProgress = progressValue;
      if (easing === 'easeInOut') {
        easedProgress = progressValue < 0.5 
          ? 2 * progressValue * progressValue 
          : 1 - Math.pow(-2 * progressValue + 2, 2) / 2;
      } else if (easing === 'easeIn') {
        easedProgress = progressValue * progressValue * progressValue;
      } else if (easing === 'easeOut') {
        easedProgress = 1 - Math.pow(1 - progressValue, 3);
      }
      
      progress.set(easedProgress);
      animationId = requestAnimationFrame(updateAnimation);
    };
    
    updateAnimation();

    // Transform progress to x position with optimized sweep pattern
    const unsubscribeX = progress.on('change', (progressValue) => {
      // Enhanced sweep: starts before container, sweeps across, exits after
      const sweepStart = -width * 1.5;
      const sweepEnd = width * 2.5;
      const sweepRange = sweepEnd - sweepStart;
      const xPosition = sweepStart + (progressValue * sweepRange);
      x.set(xPosition);
    });

    // Transform progress to sophisticated opacity pattern
    const unsubscribeOpacity = progress.on('change', (progressValue) => {
      // Multi-phase opacity: build-up, peak, fade-out with asymmetric curves
      let opacityValue: number;
      
      if (progressValue < 0.2) {
        // Build-up phase: cubic ease-in
        const phase = progressValue / 0.2;
        opacityValue = minOpacity + (Math.pow(phase, 3) * (maxOpacity - minOpacity));
      } else if (progressValue < 0.8) {
        // Sustain phase: slight oscillation at peak
        const phase = (progressValue - 0.2) / 0.6;
        const oscillation = 1 + (Math.sin(phase * Math.PI * 6) * 0.1);
        opacityValue = maxOpacity * oscillation;
      } else {
        // Fade-out phase: exponential decay
        const phase = (progressValue - 0.8) / 0.2;
        opacityValue = maxOpacity * Math.pow(1 - phase, 2);
      }
      
      // Clamp values to ensure bounds
      opacity.set(Math.max(minOpacity, Math.min(maxOpacity, opacityValue)));
    });

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      unsubscribeX();
      unsubscribeOpacity();
    };
  }, [width, duration, minOpacity, maxOpacity, easing, progress, x, opacity]);

  const variants = useMemo(() => ({
    shimmer: {
      x,
      opacity,
    },
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
    },
  }), [x, opacity]);

  return {
    x,
    opacity,
    progress,
    isAnimating,
    variants,
    animatedStyle: { x, opacity },
  };
}

export default useShimmerSweep;
