/**
 * Ultra Enhanced Card
 * Card with 3D transforms, hover effects, and smooth animations
 */

import { type ReactNode, type HTMLAttributes } from 'react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import {
  useUltraCardReveal,
  useMagneticHover,
  useHoverLift,
  useParallaxTilt,
  useGlowBorder,
} from '@/effects/reanimated';
import { cn } from '@/lib/utils';

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
    glareEnabled: enableTilt,
    scale: 1.02,
  });

  const glow = useGlowBorder({
    enabled: enableGlow,
    color: glowColor,
    intensity: 14,
    speed: 2500,
  });

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
          onMouseMove={enableTilt ? tilt.handleMouseMove : undefined}
          onMouseLeave={enableTilt ? tilt.handleMouseLeave : undefined}
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
