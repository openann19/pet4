'use client'

import { MotionView } from '@petspark/motion';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface NavButtonProps {
  isActive: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  className?: string
  enablePulse?: boolean
  enableIconAnimation?: boolean
  showIndicator?: boolean
}

export function NavButton({
  isActive,
  onClick,
  icon,
  label,
  className = '',
  enablePulse = true,
  enableIconAnimation = true,
  showIndicator = true,
}: NavButtonProps): ReactElement {
  const animation = useNavButtonAnimation({
    isActive,
    enablePulse,
    enableRotation: false,
    hapticFeedback: true,
  })

  const bounceAnimation = useBounceOnTap({
    onPress: onClick,
    hapticFeedback: true,
  })

  const handleMouseEnter = (): void => {
    animation.handleHover()
  }

  const handleMouseLeave = (): void => {
    animation.handleLeave()
  }

  const activeClasses = isActive
    ? 'bg-blue-100 text-blue-700 rounded-lg px-3 py-2 font-semibold'
    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'

  const buttonStyle: AnimatedStyle = {
    scale: animation.scale,
    translateY: animation.translateY,
    rotate: animation.rotation,
  };

  const iconStyle: AnimatedStyle = {
    scale: animation.iconScale,
    rotate: animation.iconRotation,
  };

  const indicatorStyle: AnimatedStyle = {
    opacity: animation.indicatorOpacity,
    width: animation.indicatorWidth,
  };

  const combinedStyle: AnimatedStyle = {
    ...buttonStyle,
    ...bounceAnimation.animatedStyle,
  };

  return (
    <MotionView
      style={combinedStyle}
      className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] sm:min-w-[70px] relative ${String(activeClasses ?? '')} ${String(className ?? '')}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={bounceAnimation.handlePress}
      role="button"
      tabIndex={0}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          bounceAnimation.handlePress()
        }
      }}
    >
      <MotionView
        style={enableIconAnimation ? iconStyle : undefined}
        className="relative"
      >
        {icon}
      </MotionView>
      <span className="text-[10px] sm:text-xs font-semibold leading-tight">{label}</span>
      {isActive && showIndicator && (
        <MotionView
          style={indicatorStyle}
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
        >
          <div />
        </MotionView>
      )}
    </MotionView>
  );
}
