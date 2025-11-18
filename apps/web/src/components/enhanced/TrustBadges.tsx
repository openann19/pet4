import React, { useEffect } from 'react';
import { useSharedValue, withTiming, useanimate } from '@petspark/motion';
import { MotionView } from '@petspark/motion';
import { useStaggeredItem } from '@/effects/reanimated/use-staggered-item';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Heart, Lightning, Sparkle, Star, Trophy } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { useUIConfig } from "@/hooks/use-ui-config";

interface TrustBadge {
  type: 'verified' | 'health' | 'responsive' | 'experienced' | 'top-rated' | 'favorite';
  label: string;
  description: string;
}

interface TrustBadgesProps {
  badges: TrustBadge[];
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const BADGE_CONFIG = {
  verified: {
    icon: CheckCircle,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  health: {
    icon: Heart,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  },
  responsive: {
    icon: Lightning,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/30',
  },
  experienced: {
    icon: Star,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    borderColor: 'border-secondary/30',
  },
  'top-rated': {
    icon: Trophy,
    color: 'text-[oklch(0.68_0.18_45)]',
    bgColor: 'bg-[oklch(0.68_0.18_45)]/10',
    borderColor: 'border-[oklch(0.68_0.18_45)]/30',
  },
  favorite: {
    icon: Sparkle,
    color: 'text-primary',
    bgColor: 'bg-linear-to-br from-primary/10 to-accent/10',
    borderColor: 'border-primary/30',
  },
};

const SIZE_CONFIG = {
  sm: {
    iconSize: 14,
    containerClass: 'w-7 h-7',
    gap: 'gap-1',
  },
  md: {
    iconSize: 18,
    containerClass: 'w-9 h-9',
    gap: 'gap-2',
  },
  lg: {
    iconSize: 22,
    containerClass: 'w-11 h-11',
    gap: 'gap-2.5',
  },
};

interface BadgeAnimatedProps {
  index: number;
  animated: boolean;
  sizeConfig: (typeof SIZE_CONFIG)[keyof typeof SIZE_CONFIG];
  config: (typeof BADGE_CONFIG)[keyof typeof BADGE_CONFIG];
  Icon: Icon;
}

function BadgeAnimated({ index, animated, sizeConfig, config, Icon }: BadgeAnimatedProps) {
    const _uiConfig = useUIConfig();
    const staggered = useStaggeredItem({ index, staggerDelay: 50 });
  const scale = useSharedValue(animated ? 0.8 : 1);

  useEffect(() => {
    if (animated) {
      const scaleTransition = withTiming(1, { duration: 300 });
      animate(scale, scaleTransition.target, scaleTransition.transition);
    }
  }, [animated, scale]);

  const animatedStyle = useAnimatedStyle((): Record<string, unknown> => {
    return {
      opacity: staggered.opacity.get(),
      transform: [{ translateY: staggered.y.get() }, { scale: scale.get() }],
    };
  });

  return (
    <MotionView
      style={animatedStyle}
      className={`${String(sizeConfig.containerClass ?? '')} ${String(config.bgColor ?? '')} ${String(config.borderColor ?? '')} border rounded-full flex items-center justify-center ${String(config.color ?? '')} transition-all duration-300 hover:scale-110 cursor-default`}
    >
      <Icon size={sizeConfig.iconSize} className={config.color} />
    </MotionView>
  );
}

export function TrustBadges({ badges, size = 'md', animated = true }: TrustBadgesProps) {
  if (!badges || !Array.isArray(badges) || badges.length === 0) {
    return null;
  }

  const sizeConfig = SIZE_CONFIG[size];

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap items-center ${String(sizeConfig.gap ?? '')}`}>
        {badges.map((badge, index) => {
          const config = BADGE_CONFIG[badge.type];
          const Icon = config.icon;

          const content = (
            <BadgeAnimated
              key={badge.type}
              index={index}
              animated={animated}
              sizeConfig={sizeConfig}
              config={config}
              Icon={Icon}
            />
          );

          return (
            <Tooltip key={badge.type}>
              <TooltipTrigger asChild>{content}</TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="text-center">
                  <p className="font-semibold text-sm">{badge.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

interface TrustScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TrustScore({ score, size = 'md', showLabel = false }: TrustScoreProps) {
  const strokeDasharray = useSharedValue(0);
  const circumference = 2 * Math.PI * 20; // r = 20

  useEffect(() => {
    const targetDash = (score / 100) * circumference;
    const dashTransition = withTiming(targetDash, { duration: 1000 });
    animate(strokeDasharray, dashTransition.target, dashTransition.transition);
  }, [score, circumference, strokeDasharray]);

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return 'text-green-500';
    if (scoreValue >= 60) return 'text-accent';
    if (scoreValue >= 40) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getScoreLabel = (scoreValue: number) => {
    if (scoreValue >= 80) return 'Highly Trusted';
    if (scoreValue >= 60) return 'Trusted';
    if (scoreValue >= 40) return 'Established';
    return 'New';
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const circleAnimatedStyle = useAnimatedStyle(() => {
    return {
      strokeDasharray: `${strokeDasharray.get()} ${circumference}`,
    };
  });

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-muted/20"
          />
          <MotionView style={circleAnimatedStyle}>
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              className={getScoreColor(score)}
            />
          </MotionView>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${sizeClasses[size]} ${getScoreColor(score)}`}>{score}</span>
        </div>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className={`font-semibold ${sizeClasses[size]}`}>{getScoreLabel(score)}</span>
          <span className="text-xs text-muted-foreground">Trust Score</span>
        </div>
      )}
    </div>
  );
}
