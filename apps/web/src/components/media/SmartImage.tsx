'use client';;
import { useState, useEffect, useRef } from 'react';
import { useSharedValue, usewithSpring, withTiming, MotionView } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { useFeatureFlags } from '@/config/feature-flags';
import type  from '@petspark/motion';
import { cn } from '@/lib/utils';

export interface SmartImageProps {
  src: string;
  lqip?: string; // Low Quality Image Placeholder
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onClick?: () => void;
}

/**
 * SmartImage Component
 *
 * Progressive image loading with LQIP, shimmer effect, and parallax reveal
 * Reduced motion → instant swap
 */
export function SmartImage({
  src,
  lqip,
  alt,
  className = '',
  width,
  height,
  onLoad,
  onClick,
}: SmartImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSharp, setShowSharp] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const { enableSmartImage } = useFeatureFlags();
  const imgRef = useRef<HTMLImageElement>(null);

  const shimmerOpacity = useSharedValue(0.6);
  const imageOpacity = useSharedValue(0);
  const parallaxOffset = useSharedValue(0);

  useEffect(() => {
    if (!enableSmartImage) {
      return;
    }

    if (reducedMotion) {
      // Instant swap for reduced motion
      imageOpacity.value = 1;
      return;
    }

    // Shimmer animation
    shimmerOpacity.value = withTiming(0.6, { duration: 600 });

    if (isLoaded && showSharp) {
      imageOpacity.value = withSpring(1, springConfigs.smooth);
      parallaxOffset.value = withSpring(0, springConfigs.smooth);
    }
  }, [
    isLoaded,
    showSharp,
    reducedMotion,
    enableSmartImage,
    imageOpacity,
    shimmerOpacity,
    parallaxOffset,
  ]);

  const handleLoad = () => {
    setIsLoaded(true);
    setTimeout(
      () => {
        setShowSharp(true);
        onLoad?.();
      },
      reducedMotion ? 0 : 30
    );
  };

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  })) as AnimatedStyle;

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [{ translateY: parallaxOffset.value }],
  })) as AnimatedStyle;

  if (!enableSmartImage) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        onLoad={onLoad}
      />
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ width, height }}>
      {/* LQIP placeholder */}
      {lqip && !showSharp && (
        <img
          src={lqip}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      )}
      {/* Shimmer effect */}
      {!isLoaded && (
        <MotionView
          style={shimmerStyle}
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer"
          aria-hidden="true"
        >
          <div />
        </MotionView>
      )}
      {/* Sharp image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity',
          showSharp ? 'opacity-100' : 'opacity-0',
          onClick ? 'cursor-pointer' : ''
        )}
        style={imageStyle as React.CSSProperties}
        width={width}
        height={height}
        onLoad={handleLoad}
        onClick={onClick ? () => void onClick() : undefined}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
