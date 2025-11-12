/**
 * Mock for @/effects/reanimated/transitions
 */
import { vi } from 'vitest';

export interface SpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
}

export interface TimingConfig {
  duration?: number;
  easing?: (value: number) => number;
}

export const springConfigs = {
  gentle: { damping: 30, stiffness: 300, mass: 0.8 },
  smooth: { damping: 25, stiffness: 400 },
  bouncy: { damping: 15, stiffness: 500 },
  snappy: { damping: 20, stiffness: 600 },
};

export const timingConfigs = {
  fast: { duration: 150, easing: (t: number) => t },
  smooth: { duration: 300, easing: (t: number) => t },
  slow: { duration: 500, easing: (t: number) => t },
  elastic: { duration: 400, easing: (t: number) => t },
};

// Legacy exports for backward compatibility
export const timing = timingConfigs;
export const spring = springConfigs;

export const createSpringTransition = vi.fn((config = springConfigs.smooth) => 
  (value: number) => value
);

export const createTimingTransition = vi.fn((config = timingConfigs.smooth) => 
  (value: number) => value
);

export const createDelayedTransition = vi.fn((delay: number, transition: (value: number) => number) => 
  (value: number) => transition(value)
);

export const fadeIn = {
  opacity: {
    from: 0,
    to: 1,
    config: timingConfigs.smooth,
  },
};

export const fadeOut = {
  opacity: {
    from: 1,
    to: 0,
    config: timingConfigs.fast,
  },
};

export const slideUp = {
  translateY: {
    from: 20,
    to: 0,
    config: springConfigs.smooth,
  },
  opacity: {
    from: 0,
    to: 1,
    config: timingConfigs.smooth,
  },
};

export const slideDown = {
  translateY: {
    from: -20,
    to: 0,
    config: springConfigs.smooth,
  },
  opacity: {
    from: 0,
    to: 1,
    config: timingConfigs.smooth,
  },
};

export const scaleIn = {
  scale: {
    from: 0.9,
    to: 1,
    config: springConfigs.bouncy,
  },
  opacity: {
    from: 0,
    to: 1,
    config: timingConfigs.smooth,
  },
};

export const scaleOut = {
  scale: {
    from: 1,
    to: 0.9,
    config: springConfigs.smooth,
  },
  opacity: {
    from: 1,
    to: 0,
    config: timingConfigs.fast,
  },
};
