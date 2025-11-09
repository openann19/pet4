'use client';

import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { PremiumButton } from '../PremiumButton';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

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
    const uiConfig = useUIConfig();
    const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    scale.value = withSpring(1, springConfigs.smooth);
    opacity.value = withSpring(1, springConfigs.smooth);
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

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
    <AnimatedView
      style={animatedStyle}
      className={cn('flex flex-col items-center', variants[variant], className)}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>}
      {action && (
        <PremiumButton onClick={handleAction} variant="primary" size="md">
          {action.label}
        </PremiumButton>
      )}
    </AnimatedView>
  );
}
