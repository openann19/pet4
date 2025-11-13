'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useMotionValue, animate, MotionView } from '@petspark/motion';
import { useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIConfig } from "@/hooks/use-ui-config";
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getToastAriaAttributes, generateId } from '@/lib/accessibility';

export type PremiumToastType = 'success' | 'error' | 'warning' | 'info';

export interface PremiumToastAction {
  label: string;
  onClick: () => void;
}

export interface PremiumToastProps {
  id: string;
  type: PremiumToastType;
  title: string;
  description?: string;
  action?: PremiumToastAction;
  duration?: number;
  onDismiss: (id: string) => void;
  position?: 'top' | 'bottom';
  showProgress?: boolean;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300',
  error: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
};

const iconColors = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
};

export function PremiumToast({
  id,
  type,
  title,
  description,
  action,
  duration = 5000,
  onDismiss,
  position: _position = 'top',
  showProgress = true,
}: PremiumToastProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const Icon = icons[type];
  const progressWidth = useMotionValue(100);
  const progressWidthPercent = useTransform(progressWidth, (value) => `${value}%`);
  const [isPaused, setIsPaused] = useState(false);

  const titleId = useMemo(() => generateId('toast-title'), []);
  const descriptionId = useMemo(() => generateId('toast-description'), []);
  const ariaAttributes = useMemo(() => getToastAriaAttributes(type), [type]);
  
  const spacingClasses = useMemo(
    () => getSpacingClassesFromConfig({ gap: 'md', padding: 'lg' }),
    []
  );

  const handleDismiss = useCallback(() => {
    setTimeout(() => onDismiss(id), 200);
  }, [id, onDismiss]);

  useEffect(() => {
    if (!showProgress || isPaused || duration === 0) return;

    animate(progressWidth, 0, {
      duration: duration / 1000,
      ease: 'linear',
    });

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, isPaused, showProgress, progressWidth, handleDismiss]);

  return (
    <MotionView
      style={{}}
      onMouseEnter={() => { setIsPaused(true); }}
      onMouseLeave={() => { setIsPaused(false); }}
      className={cn(
        'relative flex items-start rounded-xl border backdrop-blur-xl shadow-xl min-w-80 max-w-md',
        'transition-all duration-200',
        spacingClasses,
        colors[type]
      )}
      {...ariaAttributes}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      {showProgress && (
        <MotionView
          style={{ width: progressWidthPercent }}
          className="absolute top-0 left-0 h-1 bg-current opacity-30 rounded-t-xl"
          aria-hidden="true"
        >
          <div />
        </MotionView>
      )}

      <Icon 
        className={cn('shrink-0 mt-0.5', iconColors[type])} 
        size={20}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <div 
          id={titleId}
          className={cn(
            getTypographyClasses('subtitle'),
            getSpacingClassesFromConfig({ marginY: 'xs' })
          )}
        >
          {title}
        </div>
        {description && (
          <div 
            id={descriptionId}
            className={cn(
              getTypographyClasses('caption'),
              'opacity-90'
            )}
          >
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
            className={cn(
              getSpacingClassesFromConfig({ marginY: 'sm' }),
              'h-7 hover:bg-background/50'
            )}
            aria-label={action.label}
          >
            {action.label}
          </Button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className={cn(
          'shrink-0 opacity-50 hover:opacity-100 transition-opacity',
          getSpacingClassesFromConfig({ padding: 'xs' })
        )}
        aria-label={`Dismiss ${type} notification: ${title}`}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </MotionView>
  );
}
