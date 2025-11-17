'use client';

import type { ReactNode } from 'react';
import { MotionView } from '@petspark/motion';
import type { AnimatedStyle as ViewAnimatedStyle } from '@/effects/reanimated/animated-view';

interface EnhancedButtonContentProps {
  loading: boolean;
  enableGlow: boolean;
  glowOverlayStyle: ViewAnimatedStyle;
  loadingSpinnerStyle: ViewAnimatedStyle;
  icon?: ReactNode;
  iconPosition: 'left' | 'right';
  children: ReactNode;
}

export function EnhancedButtonContent({
  loading,
  enableGlow,
  glowOverlayStyle,
  loadingSpinnerStyle,
  icon,
  iconPosition,
  children,
}: EnhancedButtonContentProps): React.JSX.Element {
  return (
    <>
      {enableGlow && (
        <MotionView
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={glowOverlayStyle as React.CSSProperties}
        />
      )}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <MotionView
            className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
            style={loadingSpinnerStyle as React.CSSProperties}
            aria-hidden="true"
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
          </>
        )}
      </span>
    </>
  );
}

