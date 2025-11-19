/**
 * Link Preview — Web
 * - Skeleton shimmer → content crossfade
 * - Reduced motion instant crossfade (≤120ms)
 * - No duplicate style props; accessible & trimmed
 *
 * Location: apps/web/src/components/chat/LinkPreview.tsx
 */

import { useMemo } from 'react';
import { useSharedValue, withTiming, useMotionView   type AnimatedStyle,
} from '@petspark/motion';
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion';

import { safeHref } from '@/lib/url-safety';
import { SmartImage } from '@/components/media/SmartImage';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface LinkPreviewProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  isLoading?: boolean;
  className?: string;
}

export function LinkPreview({
  url,
  title,
  description,
  image,
  isLoading = false,
  className,
}: LinkPreviewProps) {
    const _uiConfig = useUIConfig();
    const reduced = useReducedMotion();
  const safeUrl = useMemo(() => safeHref(url), [url]);
  const showContent = !isLoading && (!!title || !!image) && safeUrl !== null;

  const s = useSharedValue(showContent ? 1 : 0);
  const dur = getReducedMotionDuration(360, reduced);

  useMemo(() => {
    s.value = withTiming(showContent ? 1 : 0, { duration: dur });
  }, [showContent, dur, s]);

  const skeletonStyle = useAnimatedStyle(() => ({ opacity: 1 - s.value })) as AnimatedStyle;
  const contentStyle = useAnimatedStyle(() => ({ opacity: s.value })) as AnimatedStyle;

  if (!safeUrl) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className ?? ''}`}
      aria-busy={isLoading}
      aria-live="polite"
    >
      {/* Skeleton */}
      <MotionView style={skeletonStyle} className="absolute inset-0">
        <div className="flex gap-3 p-3">
          {image && (
            <div className="w-20 h-20 bg-muted rounded animate-pulse" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-muted rounded w-full animate-pulse" />
            <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </MotionView>
      {/* Content */}
      {showContent && (
        <MotionView style={contentStyle} className="relative">
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="flex gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg"
          >
            {image && (
              <SmartImage
                src={image}
                alt={title ?? new URL(url).hostname}
                className="w-20 h-20 object-cover rounded"
                width={80}
                height={80}
              />
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className="text-sm font-semibold text-foreground line-clamp-1">{title}</h4>
              )}
              {description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 truncate">{new URL(url).hostname}</p>
            </div>
          </a>
        </MotionView>
      )}
    </div>
  );
}
