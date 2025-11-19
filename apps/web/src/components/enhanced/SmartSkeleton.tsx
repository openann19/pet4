'use client';

import { MotionView } from "@petspark/motion";
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

import { useShimmer } from '@/effects/reanimated/use-shimmer';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface SmartSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'avatar' | 'post';
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
  count?: number;
}

export function SmartSkeleton({
  variant = 'text',
  width,
  height,
  className,
  animate = true,
  count = 1,
}: SmartSkeletonProps) {
    const _uiConfig = useUIConfig();
    const shimmer = useShimmer({
        enabled: animate,
        duration: 2000,
      });

  const baseClasses = cn('bg-muted relative overflow-hidden', className);

  const shimmerStyle = useMemo(() => {
    if (!animate) return undefined;
    return shimmer.animatedStyle as AnimatedStyle;
  }, [animate, shimmer]);

  const skeletonElement = () => {
    switch (variant) {
      case 'circular': {
        const size = width ?? height ?? '40px';
        return (
          <div className={cn(baseClasses, 'rounded-full')} style={{ width: size, height: size }}>
            {animate && (
              <MotionView
                style={shimmerStyle}
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
              >
                <div />
              </MotionView>
            )}
          </div>
        );
      }

      case 'rectangular': {
        return (
          <div
            className={cn(baseClasses, 'rounded-md')}
            style={{
              width: width ?? '100%',
              height: height ?? '200px',
            }}
          >
            {animate && (
              <MotionView
                style={shimmerStyle}
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
              >
                <div />
              </MotionView>
            )}
          </div>
        );
      }

      case 'card': {
        return (
          <div className={cn(baseClasses, 'rounded-lg p-4 space-y-3')}>
            {animate && (
              <MotionView
                style={shimmerStyle}
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none"
              >
                <div />
              </MotionView>
            )}
            <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
            <div className="h-3 bg-muted-foreground/10 rounded w-full" />
            <div className="h-3 bg-muted-foreground/10 rounded w-5/6" />
            <div className="flex gap-2 mt-4">
              <div className="h-8 bg-muted-foreground/10 rounded w-20" />
              <div className="h-8 bg-muted-foreground/10 rounded w-20" />
            </div>
          </div>
        );
      }

      case 'avatar': {
        return (
          <div className="flex items-center gap-3">
            <div className={cn(baseClasses, 'rounded-full w-10 h-10 relative')}>
              {animate && (
                <MotionView
                  style={shimmerStyle}
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent rounded-full"
                >
                  <div />
                </MotionView>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className={cn(baseClasses, 'h-4 rounded w-24 relative')}>
                {animate && (
                  <MotionView
                    style={shimmerStyle}
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent rounded"
                  >
                    <div />
                  </MotionView>
                )}
              </div>
              <div className={cn(baseClasses, 'h-3 rounded w-32 relative')}>
                {animate && (
                  <MotionView
                    style={shimmerStyle}
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent rounded"
                  >
                    <div />
                  </MotionView>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'post': {
        return (
          <div className={cn(baseClasses, 'rounded-lg p-4 space-y-4')}>
            {animate && (
              <MotionView
                style={shimmerStyle}
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-lg"
              >
                <div />
              </MotionView>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted-foreground/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/10 rounded w-32" />
                <div className="h-3 bg-muted-foreground/10 rounded w-24" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted-foreground/10 rounded w-full" />
              <div className="h-3 bg-muted-foreground/10 rounded w-4/5" />
            </div>
            <div className="h-48 bg-muted-foreground/10 rounded-lg" />
            <div className="flex gap-4">
              <div className="h-8 bg-muted-foreground/10 rounded w-16" />
              <div className="h-8 bg-muted-foreground/10 rounded w-16" />
              <div className="h-8 bg-muted-foreground/10 rounded w-16" />
            </div>
          </div>
        );
      }

      default: {
        return (
          <div
            className={cn(baseClasses, 'rounded relative')}
            style={{
              width: width ?? '100%',
              height: height ?? '1em',
            }}
          >
            {animate && (
              <MotionView
                style={shimmerStyle}
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent rounded"
              >
                <div />
              </MotionView>
            )}
          </div>
        );
      }
    }
  };

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{skeletonElement()}</div>
        ))}
      </div>
    );
  }

  return skeletonElement();
}

export interface PostSkeletonProps {
  count?: number;
}

export function PostSkeleton({ count = 3 }: PostSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SmartSkeleton key={i} variant="post" />
      ))}
    </div>
  );
}

export interface CardGridSkeletonProps {
  count?: number;
}

export function CardGridSkeleton({ count = 6 }: CardGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SmartSkeleton key={i} variant="card" />
      ))}
    </div>
  );
}

export interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 5 }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SmartSkeleton key={i} variant="avatar" />
      ))}
    </div>
  );
}
