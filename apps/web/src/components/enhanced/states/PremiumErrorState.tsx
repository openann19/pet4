'use client';

import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { PremiumButton } from '../PremiumButton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useUIConfig } from "@/hooks/use-ui-config";

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
    const uiConfig = useUIConfig();
    const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const shake = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    scale.value = withSpring(1, springConfigs.smooth);
    opacity.value = withSpring(1, springConfigs.smooth);
    return {
      transform: [{ scale: scale.value }, { translateX: shake.value }],
      opacity: opacity.value,
    };
  }) as AnimatedStyle;

  const handleRetry = useCallback(() => {
    shake.value = withSpring(10, springConfigs.bouncy);
    setTimeout(() => {
      shake.value = withSpring(-10, springConfigs.bouncy);
      setTimeout(() => {
        shake.value = withSpring(0, springConfigs.smooth);
      }, 100);
    }, 100);

    haptics.impact('medium');
    onRetry?.();
  }, [onRetry, shake]);

  const errorMessage = typeof error === 'string' ? error : error?.message || message;
  const errorDetails = typeof error === 'object' && error?.stack ? error.stack : undefined;

  const variants = {
    default: 'text-center py-12 px-4',
    minimal: 'text-center py-8 px-4',
    detailed: 'text-center py-12 px-4',
  };

  return (
    <AnimatedView
      style={animatedStyle}
      className={cn('flex flex-col items-center', variants[variant], className)}
    >
      <div className="mb-4 text-destructive">
        <AlertCircle size={48} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {errorMessage && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{errorMessage}</p>
      )}
      {showDetails && errorDetails && variant === 'detailed' && (
        <details className="mb-6 text-xs text-muted-foreground max-w-md text-left">
          <summary className="cursor-pointer mb-2">Error Details</summary>
          <pre className="p-4 bg-muted rounded-md overflow-auto">{errorDetails}</pre>
        </details>
      )}
      {onRetry && (
        <PremiumButton
          onClick={handleRetry}
          variant="primary"
          size="md"
          icon={<RefreshCw size={16} />}
        >
          {retryLabel}
        </PremiumButton>
      )}
    </AnimatedView>
  );
}
