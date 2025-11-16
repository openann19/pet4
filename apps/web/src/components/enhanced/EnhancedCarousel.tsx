import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, animate } from '@petspark/motion';
import { useAnimatedStyleValue } from '@/effects/reanimated/animated-view';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { isTruthy } from '@petspark/shared';
// Unused import removed: Presence
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { useUIConfig } from "@/hooks/use-ui-config";
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

interface EnhancedCarouselProps {
  items: React.ReactNode[];
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  loop?: boolean;
  onSlideChange?: (index: number) => void;
}

export function EnhancedCarousel({
  items,
  className,
  autoPlay = false,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  loop = true,
  onSlideChange,
}: EnhancedCarouselProps) {
  const _uiConfig = useUIConfig();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const autoPlayRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const itemCount = items.length;

  const goToSlide = (index: number, dir: 'left' | 'right' = 'right') => {
    if (index === currentIndex) return;

    haptics.impact('light');
    setDirection(dir);
    setCurrentIndex(index);
    onSlideChange?.(index);
  };

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex === itemCount - 1 ? (loop ? 0 : prevIndex) : prevIndex + 1;
      if (nextIndex !== prevIndex) {
        setDirection('right');
        onSlideChange?.(nextIndex);
        haptics.impact('light');
      }
      return nextIndex;
    });
  }, [itemCount, loop, onSlideChange]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const prevIndexValue = prevIndex === 0 ? (loop ? itemCount - 1 : prevIndex) : prevIndex - 1;
      if (prevIndexValue !== prevIndex) {
        setDirection('left');
        onSlideChange?.(prevIndexValue);
        haptics.impact('light');
      }
      return prevIndexValue;
    });
  }, [itemCount, loop, onSlideChange]);

  const resetAutoPlay = useCallback(() => {
    if (autoPlay && autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, autoPlayInterval);
    }
  }, [autoPlay, autoPlayInterval, goToNext]);

  useEffect(() => {
    if (isTruthy(autoPlay)) {
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, autoPlayInterval);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
    return undefined;
  }, [autoPlay, autoPlayInterval, goToNext]);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const dragX = useSharedValue(0);

  useEffect(() => {
    const translateXTransition = withSpring(0, springConfigs.smooth);
    animate(translateX, translateXTransition.target, translateXTransition.transition);
    const opacityTransition = withTiming(1, timingConfigs.fast);
    animate(opacity, opacityTransition.target, opacityTransition.transition);
    dragX.value = 0;
  }, [currentIndex, direction, translateX, opacity, dragX]);

  const handleDragStart = useCallback(() => {
    dragX.value = 0;
  }, [dragX]);

  const handleDrag = useCallback((_e: React.MouseEvent | React.TouchEvent) => {
    // Note: Custom drag handling removed for motion facade compatibility
    // Drag functionality should be implemented using MotionView if needed
  }, []);

  const handleDragEnd = useCallback(
    (_e: React.MouseEvent | React.TouchEvent) => {
      const swipeThreshold = 50;
      const currentDrag = dragX.value;

      if (Math.abs(currentDrag) > swipeThreshold) {
        if (currentDrag > 0) {
          goToPrev();
        } else {
          goToNext();
        }
      }
      dragX.value = 0;
    },
    [dragX, goToPrev, goToNext]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.get() + dragX.get() }],
      opacity: opacity.get(),
    };
  });

  const styleValue = useAnimatedStyleValue(animatedStyle);

  if (itemCount === 0) {
    return null;
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <div className="relative aspect-4/3 bg-muted">
        <div
          key={currentIndex}
          style={styleValue}
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDrag}
          onTouchEnd={handleDragEnd}
          onClick={resetAutoPlay}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          {items[currentIndex]}
        </div>
      </div>

      {showControls && itemCount > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              goToPrev();
              resetAutoPlay();
            }}
            disabled={!loop && currentIndex === 0}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background/95 disabled:opacity-0',
              'transition-all duration-200 hover:scale-110 active:scale-95'
            )}
            aria-label="Previous slide"
          >
            <CaretLeft size={20} weight="bold" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              goToNext();
              resetAutoPlay();
            }}
            disabled={!loop && currentIndex === itemCount - 1}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background/95 disabled:opacity-0',
              'transition-all duration-200 hover:scale-110 active:scale-95'
            )}
            aria-label="Next slide"
          >
            <CaretRight size={20} weight="bold" />
          </Button>
        </>
      )}

      {showIndicators && itemCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                goToSlide(index, index > currentIndex ? 'right' : 'left');
                resetAutoPlay();
              }}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-8 bg-primary shadow-lg shadow-primary/50'
                  : 'w-2 bg-background/60 hover:bg-background/80 backdrop-blur-sm'
              )}
              aria-label={`Go to slide ${String(index + 1 ?? '')}`}
            />
          ))}
        </div>
      )}

      {itemCount > 1 && (
        <div className={cn('absolute top-3 right-3 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg', getTypographyClasses('caption'), getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'xs' }))}>
          {currentIndex + 1} / {itemCount}
        </div>
      )}
    </div>
  );
}
