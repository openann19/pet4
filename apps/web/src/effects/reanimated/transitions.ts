'use client';

import {
  withSpring,
  withTiming,
  withDelay,
  Easing,
  type WithSpringConfig,
  type WithTimingConfig,
} from '@petspark/motion';

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
  gentle: { damping: 30, stiffness: 300, mass: 0.8 } as SpringConfig,
  smooth: { damping: 25, stiffness: 400 } as SpringConfig,
  bouncy: { damping: 15, stiffness: 500 } as SpringConfig,
  snappy: { damping: 20, stiffness: 600 } as SpringConfig,
};

export const timingConfigs = {
  fast: { duration: 150, easing: Easing.ease } as TimingConfig,
  smooth: { duration: 300, easing: Easing.inOut(Easing.ease) } as TimingConfig,
  slow: { duration: 500, easing: Easing.inOut(Easing.ease) } as TimingConfig,
  elastic: { duration: 400, easing: Easing.elastic(1) } as TimingConfig,
};

export function createSpringTransition(config: SpringConfig = springConfigs.smooth) {
  return (value: number) => withSpring(value, config as WithSpringConfig);
}

export function createTimingTransition(config: TimingConfig = timingConfigs.smooth) {
  return (value: number) => withTiming(value, config as WithTimingConfig);
}

export function createDelayedTransition(delay: number, transition: (value: number) => unknown) {
  return (value: number) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withDelay(delay, { target: value, transition: transition(value) } as any);
}

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
