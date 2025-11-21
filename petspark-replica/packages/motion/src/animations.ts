/**
 * Core animation utilities and presets for PETSPARK
 */

import { Transition } from 'framer-motion';
import type { 
  AnimationVariants, 
  AnimationPreset, 
  AnimationDuration, 
  AnimationEasing,
  CompleteAnimation 
} from './types';

// Duration presets
export const DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const satisfies Record<AnimationDuration, number>;

// Easing presets
export const EASINGS = {
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  circIn: [0.6, 0, 0.4, 1],
  circOut: [0, 0.6, 0.4, 1],
  circInOut: [0.4, 0.6, 0.4, 1],
  backIn: [0.6, -0.28, 0.735, 0.045],
  backOut: [0.175, 0.885, 0.32, 1.275],
  backInOut: [0.68, -0.55, 0.265, 1.55],
  anticipate: [0, 0, 0.2, 1],
} as const satisfies Record<AnimationEasing, number[]>;

// Common transitions
export const TRANSITIONS = {
  default: {
    duration: DURATIONS.normal,
    ease: EASINGS.easeInOut,
  },
  fast: {
    duration: DURATIONS.fast,
    ease: EASINGS.easeInOut,
  },
  slow: {
    duration: DURATIONS.slow,
    ease: EASINGS.easeInOut,
  },
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  },
  springGentle: {
    type: 'spring',
    stiffness: 100,
    damping: 20,
  },
  springBouncy: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  },
} as const;

// Fade animations
export const fadeVariants: AnimationVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  hover: { opacity: 0.8 },
  tap: { opacity: 0.6 },
  disabled: { opacity: 0.5 },
};

// Scale animations
export const scaleVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  disabled: { scale: 0.9, opacity: 0.5 },
};

// Slide animations
export const slideVariants: AnimationVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { y: -2 },
  tap: { y: 2 },
  disabled: { opacity: 0.5, y: 0 },
};

// Slide from left
export const slideLeftVariants: AnimationVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  hover: { x: -2 },
  tap: { x: 2 },
  disabled: { opacity: 0.5, x: 0 },
};

// Slide from right
export const slideRightVariants: AnimationVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  hover: { x: 2 },
  tap: { x: -2 },
  disabled: { opacity: 0.5, x: 0 },
};

// Drawer animations
export const drawerVariants: AnimationVariants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
  hover: { x: -4 },
  disabled: { x: '100%' },
};

// Modal animations
export const modalVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
  disabled: { opacity: 0.5, scale: 0.9 },
};

// Card animations
export const cardVariants: AnimationVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1 },
  hover: { 
    y: -8,
    scale: 1.02,
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  tap: { scale: 0.98 },
  disabled: { opacity: 0.5, scale: 0.9 },
};

// Button animations
export const buttonVariants: AnimationVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  hover: { 
    scale: 1.05,
    boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
  },
  tap: { scale: 0.95 },
  disabled: { opacity: 0.5, scale: 0.9 },
};

// List animations (staggered)
export const listVariants: AnimationVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const listItemVariants: AnimationVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { x: 4 },
  tap: { scale: 0.98 },
  disabled: { opacity: 0.5 },
};

// Tab animations
export const tabVariants: AnimationVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  hover: { y: -2 },
  tap: { scale: 0.95 },
  disabled: { opacity: 0.5 },
};

// Loading animations
export const loadingVariants: AnimationVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse',
      duration: 1,
    },
  },
};

// Pulse animations
export const pulseVariants: AnimationVariants = {
  hidden: { opacity: 1 },
  visible: { 
    opacity: [1, 0.5, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
    },
  },
};

// Bounce animations
export const bounceVariants: AnimationVariants = {
  hidden: { y: 0 },
  visible: { 
    y: [0, -10, 0],
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: 'easeInOut',
    },
  },
};

// Shake animations
export const shakeVariants: AnimationVariants = {
  hidden: { x: 0 },
  visible: { 
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      repeat: Infinity,
      duration: 0.5,
      repeatDelay: 2,
    },
  },
};

// Animation presets collection
export const ANIMATION_PRESETS: Record<string, AnimationPreset> = {
  fade: {
    name: 'fade',
    variants: fadeVariants,
    transition: TRANSITIONS.default,
  },
  scale: {
    name: 'scale',
    variants: scaleVariants,
    transition: TRANSITIONS.spring,
  },
  slide: {
    name: 'slide',
    variants: slideVariants,
    transition: TRANSITIONS.default,
  },
  slideLeft: {
    name: 'slideLeft',
    variants: slideLeftVariants,
    transition: TRANSITIONS.default,
  },
  slideRight: {
    name: 'slideRight',
    variants: slideRightVariants,
    transition: TRANSITIONS.default,
  },
  drawer: {
    name: 'drawer',
    variants: drawerVariants,
    transition: TRANSITIONS.springGentle,
  },
  modal: {
    name: 'modal',
    variants: modalVariants,
    transition: TRANSITIONS.spring,
  },
  card: {
    name: 'card',
    variants: cardVariants,
    transition: TRANSITIONS.spring,
  },
  button: {
    name: 'button',
    variants: buttonVariants,
    transition: TRANSITIONS.spring,
  },
  list: {
    name: 'list',
    variants: listVariants,
    transition: TRANSITIONS.default,
  },
  listItem: {
    name: 'listItem',
    variants: listItemVariants,
    transition: TRANSITIONS.default,
  },
  tab: {
    name: 'tab',
    variants: tabVariants,
    transition: TRANSITIONS.default,
  },
  loading: {
    name: 'loading',
    variants: loadingVariants,
    transition: TRANSITIONS.default,
  },
  pulse: {
    name: 'pulse',
    variants: pulseVariants,
    transition: TRANSITIONS.default,
  },
  bounce: {
    name: 'bounce',
    variants: bounceVariants,
    transition: TRANSITIONS.default,
  },
  shake: {
    name: 'shake',
    variants: shakeVariants,
    transition: TRANSITIONS.default,
  },
};

// Helper functions
export function createCustomAnimation(
  hidden: CompleteAnimation,
  visible: CompleteAnimation,
  options?: {
    hover?: CompleteAnimation;
    tap?: CompleteAnimation;
    disabled?: CompleteAnimation;
    transition?: Transition;
  }
): AnimationVariants {
  const variants: AnimationVariants = {
    hidden,
    visible,
  };

  if (options?.hover) variants.hover = options.hover;
  if (options?.tap) variants.tap = options.tap;
  if (options?.disabled) variants.disabled = options.disabled;

  return variants;
}

export function getAnimationPreset(name: keyof typeof ANIMATION_PRESETS): AnimationPreset {
  return ANIMATION_PRESETS[name];
}

export function getTransition(
  type: keyof typeof TRANSITIONS,
  custom?: Partial<Transition>
): Transition {
  return { ...TRANSITIONS[type], ...custom };
}

export function staggeredAnimation(
  variants: AnimationVariants,
  staggerDelay: number = 0.1
): AnimationVariants {
  return {
    hidden: variants.hidden,
    visible: {
      ...variants.visible,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0,
      },
    },
  };
}
