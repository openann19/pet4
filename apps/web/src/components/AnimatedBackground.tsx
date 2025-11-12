'use client';

import { useMemo, type ReactElement } from 'react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useFloatingParticle } from '@/effects/reanimated/use-floating-particle';
import { useGradientAnimation } from '@/effects/reanimated/use-gradient-animation';

interface FloatingParticleProps {
  initialX: number;
  initialY: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
}

function FloatingParticle({
  initialX,
  initialY,
  width,
  height,
  duration,
  delay,
}: FloatingParticleProps): ReactElement {
  const particleAnimation = useFloatingParticle({
    initialX,
    initialY,
    width,
    height,
    duration,
    delay,
  });

  return (
    <AnimatedView
      className="absolute w-2 h-2 rounded-full bg-primary/20 blur-sm"
      style={particleAnimation.style}
    >
      <div />
    </AnimatedView>
  );
}

export function AnimatedBackground(): ReactElement {
  const particles = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const width = window.innerWidth || 1920;
    const height = window.innerHeight || 1080;
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      initialX: Math.random() * width,
      initialY: Math.random() * height,
      width,
      height,
      duration: 15 + Math.random() * 10,
      delay: Math.random() * 5,
    }));
  }, []);

  const gradient1 = useGradientAnimation({
    type: 'combined',
    duration: 10,
    opacityRange: [0.6, 0.9],
    scaleRange: [1, 1.4],
    translateRange: { x: [0, 100], y: [0, 60] },
  });

  const gradient2 = useGradientAnimation({
    type: 'combined',
    duration: 12,
    delay: 1.5,
    opacityRange: [0.5, 0.8],
    scaleRange: [1, 1.5],
    translateRange: { x: [0, -100], y: [0, -60] },
  });

  const gradient3 = useGradientAnimation({
    type: 'rotate',
    duration: 18,
    opacityRange: [0.4, 0.7],
    scaleRange: [1, 1.3],
    rotationRange: [0, 360],
  });

  const gradient4 = useGradientAnimation({
    type: 'rotate',
    duration: 22,
    delay: 2.5,
    opacityRange: [0.3, 0.5],
    scaleRange: [1, 1.2],
    rotationRange: [0, 360],
  });

  const gradient5 = useGradientAnimation({
    type: 'combined',
    duration: 16,
    delay: 4,
    opacityRange: [0.3, 0.6],
    scaleRange: [1, 1.25],
    translateRange: { x: [-50, 50], y: [-50, 50] },
  });

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <FloatingParticle
          key={particle.id}
          initialX={particle.initialX}
          initialY={particle.initialY}
          width={particle.width}
          height={particle.height}
          duration={particle.duration}
          delay={particle.delay}
        />
      ))}

      <AnimatedView
        className="absolute top-0 left-1/4 w-225 h-225 bg-gradient-radial from-primary/18 via-primary/10 to-transparent rounded-full filter blur-[150px]"
        style={gradient1.style}
      >
        <div />
      </AnimatedView>
      <AnimatedView
        className="absolute bottom-0 right-1/4 w-225 h-225 bg-gradient-radial from-accent/18 via-accent/10 to-transparent rounded-full filter blur-[150px]"
        style={gradient2.style}
      >
        <div />
      </AnimatedView>
      <AnimatedView
        className="absolute top-1/3 right-1/3 w-200 h-200 bg-gradient-radial from-secondary/15 via-secondary/8 to-transparent rounded-full filter blur-[130px]"
        style={gradient3.style}
      >
        <div />
      </AnimatedView>
      <AnimatedView
        className="absolute top-2/3 left-1/3 w-175 h-175 bg-gradient-conic from-primary/12 via-accent/12 to-secondary/12 rounded-full filter blur-[110px]"
        style={gradient4.style}
      >
        <div />
      </AnimatedView>
      <AnimatedView
        className="absolute top-1/2 left-1/2 w-150 h-150 bg-gradient-radial from-lavender/12 via-lavender/6 to-transparent rounded-full filter blur-[120px]"
        style={gradient5.style}
      >
        <div />
      </AnimatedView>
    </div>
  );
}
