'use client';;
import React, { useCallback, useEffect } from 'react';
import { useSharedValue, usewithSpring, animate, MotionView } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { PremiumButton } from '../PremiumButton';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getTypographyClasses } from '@/lib/typography';

export interface PremiumEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'minimal' | 'illustrated';
  className?: string;
}

export function PremiumEmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: PremiumEmptyStateProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    const scaleTransition = withSpring(1, springConfigs.smooth);
    animate(scale, scaleTransition.target, scaleTransition.transition);
    const opacityTransition = withSpring(1, springConfigs.smooth);
    animate(opacity, opacityTransition.target, opacityTransition.transition);
  }, [scale, opacity, prefersReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.get() }],
      opacity: opacity.get(),
    };
  });

  const handleAction = useCallback(() => {
    haptics.impact('light');
    action?.onClick();
  }, [action]);

  const variants = {
    default: 'text-center py-12 px-4',
    minimal: 'text-center py-8 px-4',
    illustrated: 'text-center py-16 px-4',
  };

  return (
    <MotionView
      style={animatedStyle}
      className={cn('flex flex-col items-center', variants[variant], className)}
    >
      {icon && (
        <div className="mb-4 text-(--text-muted)" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className={cn(getTypographyClasses('subtitle'), 'mb-2 text-(--text-primary)')}>
        {title}
      </h3>
      {description && (
        <p className={cn(getTypographyClasses('body'), 'mb-6 max-w-[60ch] text-(--text-muted)')}>
          {description}
        </p>
      )}
      {action && (
        <PremiumButton onClick={() => void handleAction()} variant="default" size="default">
          {action.label}
        </PremiumButton>
      )}
    </MotionView>
  );
}
