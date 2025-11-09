'use client';

import { type ReactNode } from 'react';
import { AnimatedView, type AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useAiReplyAnimation } from './effects/use-ai-reply-animation';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface AnimatedAIWrapperProps {
  children: ReactNode;
  enabled?: boolean;
  showShimmer?: boolean;
  showSparkles?: boolean;
  showGlow?: boolean;
  className?: string;
}

export function AnimatedAIWrapper({
  children,
  enabled = true,
  showShimmer = true,
  showSparkles = true,
  showGlow = true,
  className,
}: AnimatedAIWrapperProps): React.JSX.Element {
    const uiConfig = useUIConfig();
    const aiAnimation = useAiReplyAnimation({
        enabled,
        showShimmer,
        showSparkles,
        showGlow,
      });

  return (
    <AnimatedView
      style={aiAnimation.containerStyle as AnimatedStyle}
      className={cn('relative', className)}
    >
      {showGlow && (
        <AnimatedView
          style={aiAnimation.glowStyle as AnimatedStyle}
          className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
        >
          <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 blur-xl" />
        </AnimatedView>
      )}

      {showShimmer && (
        <AnimatedView
          style={aiAnimation.shimmerStyle as AnimatedStyle}
          className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent w-1/3" />
        </AnimatedView>
      )}

      {showSparkles && (
        <AnimatedView
          style={aiAnimation.sparkleStyle as AnimatedStyle}
          className="absolute -top-2 -right-2 pointer-events-none z-10"
        >
          <div className="text-2xl">✨</div>
        </AnimatedView>
      )}

      {children}
    </AnimatedView>
  );
}
