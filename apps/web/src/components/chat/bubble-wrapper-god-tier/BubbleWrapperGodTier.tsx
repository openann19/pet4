'use client';

import { type ReactNode } from 'react';
import { useAnimatedStyle, MotionView } from '@petspark/motion';
import { type AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useTypingIndicator } from './effects/useTypingIndicator';
import { useReactionTrail, type ReactionTrailParticle } from './effects/useReactionTrail';
import { useAiReplyAnimation } from './effects/use-ai-reply-animation';
import { useBubbleMoodTheme } from './effects/useBubbleMoodTheme';
import { useMessageAgeEffect } from './effects/useMessageAgeEffect';
import { useBubbleCompressionOnSpeed } from './effects/useBubbleCompressionOnSpeed';
import { useDeleteBubbleAnimation } from './effects/use-delete-bubble-animation';
import { useParticleExplosionDelete } from '@/hooks/use-particle-explosion-delete';
import { ParticleView } from '../ParticleView';
import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface BubbleWrapperGodTierProps {
  children: ReactNode;
  showTyping?: boolean;
  isAIMessage?: boolean;
  messageText?: string;
  timestamp?: number | string;
  messageRate?: number;
  deleteContext?: 'self-delete' | 'admin-delete' | 'emoji-media' | 'group-chat';
  onDeleteFinish?: () => void;
  className?: string;
  enabled?: boolean;
  isDeleting?: boolean;
}

export function BubbleWrapperGodTier({
  children,
  showTyping = false,
  isAIMessage = false,
  messageText = '',
  timestamp,
  messageRate = 0,
  deleteContext = 'self-delete',
  onDeleteFinish,
  className,
  enabled = true,
  isDeleting = false,
}: BubbleWrapperGodTierProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const typingIndicator = useTypingIndicator({
    enabled: showTyping && enabled,
  });

  const reactionTrail = useReactionTrail({
    enabled,
  });

  const aiAnimation = useAiReplyAnimation({
    enabled: isAIMessage && enabled,
  });

  const moodTheme = useBubbleMoodTheme({
    text: messageText,
    enabled,
  });

  const ageEffect = useMessageAgeEffect({
    timestamp: timestamp ?? Date.now(),
    enabled,
  });

  const compression = useBubbleCompressionOnSpeed({
    messageRate,
    enabled,
  });

  const deleteAnimationOptions: {
    context: 'self-delete' | 'admin-delete' | 'emoji-media' | 'group-chat';
    onFinish?: () => void;
  } = {
    context: deleteContext,
    ...(onDeleteFinish !== undefined ? { onFinish: onDeleteFinish } : {}),
  };
  const deleteAnimation = useDeleteBubbleAnimation(deleteAnimationOptions);

  const bubbleRef = useRef<HTMLDivElement>(null);

  const particleExplosion = useParticleExplosionDelete({
    enabled: enabled && isDeleting,
    colors:
      deleteContext === 'admin-delete'
        ? ['hsl(var(--destructive))', 'hsl(var(--destructive) / 0.8)', 'hsl(var(--destructive) / 0.6)']
        : ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))'],
    particleCount: deleteContext === 'admin-delete' ? 20 : 15,
  });

  useEffect(() => {
    if (isDeleting && bubbleRef.current) {
      deleteAnimation.triggerDelete();

      const rect = bubbleRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      particleExplosion.triggerExplosion(centerX, centerY);
    }
  }, [isDeleting, deleteAnimation, particleExplosion]);

  const combinedStyle = useAnimatedStyle(() => {
    return {
      opacity: ageEffect.opacity * deleteAnimation.opacity.value,
      transform: [
        { scale: ageEffect.scale * deleteAnimation.scale.value },
        { scaleY: compression.scaleY.value },
        { translateY: deleteAnimation.translateY.value },
        { translateX: deleteAnimation.translateX.value },
        { rotate: `${deleteAnimation.rotation.value}deg` },
      ],
      marginBottom: compression.marginBottom.value,
      height: deleteAnimation.height.value,
      overflow: 'hidden' as const,
    };
  }) as AnimatedStyle;

  return (
    <div className={cn('relative', className)} ref={bubbleRef}>
      <MotionView style={combinedStyle} className="relative">
        {isAIMessage && (
          <MotionView style={aiAnimation.containerStyle as AnimatedStyle} className="relative">
            <MotionView
              style={aiAnimation.glowStyle as AnimatedStyle}
              className="absolute inset-0 rounded-2xl pointer-events-none -z-10 bg-linear-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 blur-xl"
            >
              <div />
            </MotionView>
            <MotionView
              style={aiAnimation.shimmerStyle as AnimatedStyle}
              className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent w-1/3" />
            </MotionView>
          </MotionView>
        )}

        <MotionView
          style={moodTheme.animatedStyle as AnimatedStyle}
          className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
        >
          <div />
        </MotionView>

        {showTyping ? (
          <div className="flex items-center gap-1 px-4 py-3">
            {typingIndicator.dotStyles.map((style, index) => (
              <MotionView
                key={index}
                style={style as AnimatedStyle}
                className="rounded-full bg-foreground/30"
              >
                <div />
              </MotionView>
            ))}
          </div>
        ) : (
          children
        )}

        {reactionTrail.particles.map((particle: ReactionTrailParticle) => (
          <MotionView
            key={particle.id}
            style={reactionTrail.getParticleStyle(particle) as AnimatedStyle}
            className="absolute pointer-events-none z-9999 text-2xl"
          >
            {particle.emoji}
          </MotionView>
        ))}
      </MotionView>
      {particleExplosion.particles.map((particle) => (
        <ParticleView
          key={particle.id}
          particle={particle}
          className="absolute pointer-events-none z-[10000] rounded-full"
        />
      ))}
    </div>
  );
}
