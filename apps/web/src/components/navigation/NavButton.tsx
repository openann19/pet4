'use client';

import { type ReactNode } from 'react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface NavButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  className?: string;
  enablePulse?: boolean;
  enableIconAnimation?: boolean;
}

export function NavButton({
  isActive,
  onClick,
  icon,
  label,
  className = '',
  enablePulse = true,
  enableIconAnimation = true,
}: NavButtonProps): React.ReactElement {
  const animation = useNavButtonAnimation({
    isActive,
    enablePulse,
    enableRotation: false,
    hapticFeedback: true,
  });

  const bounceAnimation = useBounceOnTap({
    onPress: onClick,
    hapticFeedback: true,
  });

  const handleMouseEnter = (): void => {
    animation.handleHover();
  };

  const handleMouseLeave = (): void => {
    animation.handleLeave();
  };

  const activeClasses = isActive
    ? 'text-primary bg-linear-to-br from-primary/20 to-accent/15 shadow-lg shadow-primary/25'
    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60';

  const combinedStyle: AnimatedStyle = {
    ...(animation.buttonStyle as Record<string, unknown>),
    transform: [
      ...((animation.buttonStyle as { transform?: Record<string, unknown>[] })?.transform || []),
      ...((bounceAnimation.animatedStyle as { transform?: Record<string, unknown>[] })?.transform ||
        []),
    ],
  };

  return (
    <AnimatedView
      style={combinedStyle}
      className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] sm:min-w-[70px] relative ${activeClasses} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={bounceAnimation.handlePress}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          bounceAnimation.handlePress();
        }
      }}
    >
      <AnimatedView
        style={enableIconAnimation ? animation.iconStyle : undefined}
        className="relative"
      >
        {icon}
      </AnimatedView>
      <span className="text-[10px] sm:text-xs font-semibold leading-tight">{label}</span>
      {isActive && (
        <AnimatedView
          style={animation.indicatorStyle}
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
        >
          <div />
        </AnimatedView>
      )}
    </AnimatedView>
  );
}
