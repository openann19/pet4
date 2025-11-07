/**
 * Ultra Enhanced Card
 * Card with 3D transforms, hover effects, and smooth animations
 */

import {
  useGlowBorder,
  useHoverLift,
  useMagneticHover,
  useParallaxTilt,
  useUltraCardReveal,
} from '@/effects/reanimated';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { cn } from '@/lib/utils';
import { type HTMLAttributes, type ReactNode } from 'react';

export interface UltraCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  index?: number;
  enableReveal?: boolean;
  enableMagnetic?: boolean;
  enableHoverLift?: boolean;
  enableTilt?: boolean;
  enableGlow?: boolean;
  glowColor?: string;
  className?: string;
}

export function UltraCard({
  children,
  index = 0,
  enableReveal = true,
  enableMagnetic = false,
  enableHoverLift = true,
  enableTilt = false,
  enableGlow = false,
  glowColor = 'rgba(99, 102, 241, 0.4)',
  className,
  ...props
}: UltraCardProps) {
  const reveal = useUltraCardReveal({
    index,
    enabled: enableReveal,
    delay: 0,
    rotationIntensity: 12,
  });

  const magnetic = useMagneticHover({
    strength: 0.2,
    maxDistance: 50,
    enabled: enableMagnetic,
  });

  const hoverLift = useHoverLift({
    scale: 1.03,
    translateY: -6,
    damping: 22,
    stiffness: 180,
  });

  const tilt = useParallaxTilt({
    maxTilt: 8,
  });

  const glow = useGlowBorder({
    enabled: enableGlow,
    color: glowColor,
    intensity: 14,
    speed: 2500,
  });

  const handleTiltMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    tilt.handleMove(x, y, rect.width, rect.height)
  }

  const combinedStyle = {
    ...reveal.animatedStyle,
    ...(enableMagnetic ? magnetic.animatedStyle : {}),
  };

  return (
    <div
      ref={enableMagnetic ? magnetic.handleRef : undefined}
      onMouseEnter={enableMagnetic ? magnetic.handleMouseEnter : hoverLift.handleEnter}
      onMouseLeave={enableMagnetic ? magnetic.handleMouseLeave : hoverLift.handleLeave}
      onMouseMove={enableMagnetic ? magnetic.handleMouseMove : undefined}
      className="inline-block"
    >
      <AnimatedView style={combinedStyle}>
        <div
          onMouseMove={enableTilt ? handleTiltMove : undefined}
          onMouseLeave={enableTilt ? tilt.handleLeave : undefined}
          className="relative"
        >
          <AnimatedView style={enableHoverLift ? hoverLift.animatedStyle : (enableTilt ? tilt.animatedStyle : {})}>
            <div
              className={cn(
                'bg-card border border-border rounded-xl shadow-lg transition-shadow duration-300',
                'hover:shadow-2xl',
                className
              )}
              {...props}
            >
              {enableGlow && (
                <AnimatedView style={glow.animatedStyle}>
                  <div className="absolute inset-0 rounded-xl pointer-events-none" />
                </AnimatedView>
              )}
              <div className="relative z-10">{children}</div>
            </div>
          </AnimatedView>
        </div>
      </AnimatedView>
    </div>
  );
}
