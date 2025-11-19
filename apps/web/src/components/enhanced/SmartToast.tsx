import React, { useEffect, useCallback } from 'react';
import {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withTiming,
  animate,
  MotionView,
  Presence,
  type AnimatedStyle,
} from '@petspark/motion';
import { X, CheckCircle, Warning, Info, XCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { springConfigs } from '@/effects/reanimated/transitions';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getToastAriaAttributes, getAriaButtonAttributes, generateId } from '@/lib/accessibility';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface SmartToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
  onDismiss: (id: string) => void;
  position?: 'top' | 'bottom';
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: Warning,
  info: Info,
};

const colors = {
  success: 'bg-(--success)/10 border-(--success)/30 text-(--success)',
  error: 'bg-(--danger)/10 border-(--danger)/30 text-(--danger)',
  warning: 'bg-(--warning)/10 border-(--warning)/30 text-(--warning)',
  info: 'bg-(--accent)/10 border-(--accent)/30 text-(--accent)',
};

const iconColors = {
  success: 'text-(--success)',
  error: 'text-(--danger)',
  warning: 'text-(--warning)',
  info: 'text-(--accent)',
};

export function SmartToast({
  id,
  type,
  title,
  description,
  action,
  duration = 5000,
  onDismiss,
  position = 'top',
}: SmartToastProps) {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const Icon = icons[type];
  const titleId = generateId('toast-title');
  const descriptionId = description ? generateId('toast-description') : undefined;
  const toastAria = getToastAriaAttributes(type);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(position === 'top' ? -20 : 20);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0.95);

  const handleDismiss = useCallback(() => {
    if (prefersReducedMotion) {
      onDismiss(id);
      return;
    }
    const opacityTransition = withTiming(0, { duration: 200 });
    animate(opacity, opacityTransition.target, opacityTransition.transition);
    const translateXTransition = withTiming(300, { duration: 200 });
    animate(translateX, translateXTransition.target, translateXTransition.transition);
    const scaleTransition = withTiming(0.9, { duration: 200 });
    animate(scale, scaleTransition.target, scaleTransition.transition);
    setTimeout(() => onDismiss(id), 200);
  }, [id, onDismiss, opacity, translateX, scale, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }
    const opacityTransition = withSpring(1, springConfigs.smooth);
    animate(opacity, opacityTransition.target, opacityTransition.transition);
    const translateYTransition = withSpring(0, springConfigs.smooth);
    animate(translateY, translateYTransition.target, translateYTransition.transition);
    const scaleTransition = withSpring(1, springConfigs.smooth);
    animate(scale, scaleTransition.target, scaleTransition.transition);
  }, [opacity, translateY, scale, prefersReducedMotion]);

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [duration, handleDismiss]);

  const animatedStyle = useAnimatedStyle((): Record<string, unknown> => ({
    opacity: opacity.get(),
    transform: [
      { translateY: translateY.get() },
      { translateX: translateX.get() },
      { scale: scale.get() },
    ],
  }));

  return (
    <MotionView
      style={animatedStyle}
      role={toastAria.role}
      aria-live={toastAria['aria-live']}
      aria-atomic={toastAria['aria-atomic']}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cn(
        'relative flex items-start rounded-xl border backdrop-blur-xl shadow-xl min-w-80 max-w-md',
        getSpacingClassesFromConfig({ gap: 'md', padding: 'lg' }),
        colors[type]
      )}
    >
      <Icon className={cn('shrink-0 mt-0.5', iconColors[type])} size={20} weight="fill" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div id={titleId} className={cn(getTypographyClasses('caption'), 'font-semibold text-(--text-primary)', getSpacingClassesFromConfig({ marginY: 'xs' }))}>
          {title}
        </div>
        {description && (
          <div id={descriptionId} className={cn(getTypographyClasses('caption'), 'opacity-90 leading-relaxed text-(--text-muted)')}>
            {description}
          </div>
        )}
        {action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              action.onClick();
              handleDismiss();
            }}
            className={cn(getTypographyClasses('caption'), 'font-medium hover:bg-(--background)/50', getSpacingClassesFromConfig({ marginY: 'sm' }))}
            {...getAriaButtonAttributes({ label: action.label })}
          >
            {action.label}
          </Button>
        )}
      </div>
      <button
        onClick={() => void handleDismiss()}
        className={cn(
          'shrink-0 opacity-50 hover:opacity-100 min-w-[44px] min-h-[44px] flex items-center justify-center',
          prefersReducedMotion ? '' : 'transition-opacity duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)'
        )}
        {...getAriaButtonAttributes({ label: 'Dismiss notification' })}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </MotionView>
  );
}

export function SmartToastContainer({
  toasts,
  onDismiss,
  position = 'top',
}: {
  toasts: SmartToastProps[];
  onDismiss: (id: string) => void;
  position?: 'top' | 'bottom';
}) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        'fixed left-0 right-0 z-50 flex flex-col items-end pointer-events-none',
        getSpacingClassesFromConfig({ gap: 'sm', paddingX: 'lg' }),
        position === 'top' ? 'top-4' : 'bottom-4'
      )}
    >
      <Presence visible={toasts.length > 0}>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <SmartToast {...toast} onDismiss={onDismiss} position={position} />
          </div>
        ))}
      </Presence>
    </div>
  );
}
