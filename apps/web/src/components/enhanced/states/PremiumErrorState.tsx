'use client';;
import React, { useCallback, useEffect } from 'react';
import { useSharedValue, usewithSpring, animate, MotionView } from '@petspark/motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { PremiumButton } from '../PremiumButton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getTypographyClasses } from '@/lib/typography';

export interface PremiumErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'default' | 'minimal' | 'detailed';
  showDetails?: boolean;
  className?: string;
}

export function PremiumErrorState({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'default',
  showDetails = false,
  className,
}: PremiumErrorStateProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const shake = useSharedValue(0);

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

  const animatedStyle = useAnimatedStyle((): Record<string, unknown> => {
    return {
      transform: [{ scale: scale.get() }, { translateX: shake.get() }],
      opacity: opacity.get(),
    };
  });

  const handleRetry = useCallback(() => {
    if (!prefersReducedMotion) {
      const shake1Transition = withSpring(10, springConfigs.bouncy);
      animate(shake, shake1Transition.target, shake1Transition.transition);
      setTimeout(() => {
        const shake2Transition = withSpring(-10, springConfigs.bouncy);
        animate(shake, shake2Transition.target, shake2Transition.transition);
        setTimeout(() => {
          const shake3Transition = withSpring(0, springConfigs.smooth);
          animate(shake, shake3Transition.target, shake3Transition.transition);
        }, 100);
      }, 100);
    }

    haptics.impact('medium');
    onRetry?.();
  }, [onRetry, shake, prefersReducedMotion]);

  const errorMessage = typeof error === 'string' ? error : error?.message ?? message;
  const errorDetails = typeof error === 'object' && error?.stack ? error.stack : undefined;

  const variants = {
    default: 'text-center py-12 px-4',
    minimal: 'text-center py-8 px-4',
    detailed: 'text-center py-12 px-4',
  };

  return (
    <MotionView
      style={animatedStyle}
      className={cn('flex flex-col items-center', variants[variant], className)}
    >
      <div className="mb-4 text-(--danger)" aria-hidden="true">
        <AlertCircle size={48} />
      </div>
      <h3 className={cn(getTypographyClasses('subtitle'), 'mb-2 text-(--text-primary)')}>
        {title}
      </h3>
      {errorMessage && (
        <p className={cn(getTypographyClasses('body'), 'mb-6 max-w-[60ch] text-(--text-muted)')}>
          {errorMessage}
        </p>
      )}
      {showDetails && errorDetails && variant === 'detailed' && (
        <details className="mb-6 max-w-[60ch] text-left">
          <summary className={cn(getTypographyClasses('caption'), 'cursor-pointer mb-2 text-(--text-muted)')}>
            Error Details
          </summary>
          <pre className={cn(getTypographyClasses('hint'), 'p-4 bg-(--surface) rounded-md overflow-auto text-(--text-muted)')}>
            {errorDetails}
          </pre>
        </details>
      )}
      {onRetry && (
        <PremiumButton
          onClick={() => void handleRetry()}
          variant="default"
          size="default"
          icon={<RefreshCw size={16} />}
        >
          {retryLabel}
        </PremiumButton>
      )}
    </MotionView>
  );
}
