/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
import React from 'react';

// Mock framer-motion to prevent React context issues in test environment
const motionComponent = React.forwardRef(({ children, ...props }: any, ref: any) =>
  React.createElement('div', { ...props, ref }, children)
);

export const motion = {
  div: motionComponent,
  span: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('span', { ...props, ref }, children)
  ),
  button: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('button', { ...props, ref }, children)
  ),
  form: motionComponent,
  input: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('input', { ...props, ref }, children)
  ),
  textarea: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('textarea', { ...props, ref }, children)
  ),
  select: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('select', { ...props, ref }, children)
  ),
  option: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('option', { ...props, ref }, children)
  ),
  img: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('img', { ...props, ref }, children)
  ),
  a: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('a', { ...props, ref }, children)
  ),
  ul: motionComponent,
  ol: motionComponent,
  li: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('li', { ...props, ref }, children)
  ),
  h1: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('h1', { ...props, ref }, children)
  ),
  h2: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('h2', { ...props, ref }, children)
  ),
  h3: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('h3', { ...props, ref }, children)
  ),
  h4: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('h4', { ...props, ref }, children)
  ),
  h5: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('h5', { ...props, ref }, children)
  ),
  h6: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('h6', { ...props, ref }, children)
  ),
  p: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('p', { ...props, ref }, children)
  ),
  section: motionComponent,
  article: motionComponent,
  header: motionComponent,
  footer: motionComponent,
  nav: motionComponent,
  main: motionComponent,
  aside: motionComponent,
};

export const MotionConfig = ({ children }: { children: React.ReactNode }) => children;
export const AnimatePresence = ({ children }: { children: React.ReactNode }) => children;
export const LayoutGroup = ({ children }: { children: React.ReactNode }) => children;

export const useAnimation = () => ({
  start: () => Promise.resolve(),
  stop: () => {},
});

export const useMotionValue = (initial: any) => ({
  value: initial,
  set: () => {},
  get: () => initial,
});

export const useTransform = (value: any, transform: any) => ({
  value: transform(value.get ? value.get() : value),
  set: () => {},
  get: () => transform(value.get ? value.get() : value),
});

export const useInView = () => false;

export const useScroll = () => ({
  scrollY: { get: () => 0, set: () => {} },
  scrollX: { get: () => 0, set: () => {} },
});

export const useSpring = () => ({ value: 0 });

export const useMotionTemplate = () => '';

export const domAnimation = {};

export const useReducedMotion = () => false;

export const useAnimate = () => [() => {}, () => Promise.resolve()];

export const useDragControls = () => ({
  start: () => {},
  stop: () => {},
});

export const usePresence = () => [true, null];

export const useTime = () => ({ value: 0 });

export const useVelocity = () => ({ value: 0 });

export const useAnimationFrame = () => ({ value: 0 });

export const useElementScroll = () => ({
  scrollY: { get: () => 0, set: () => {} },
  scrollX: { get: () => 0, set: () => {} },
});

export const useViewportScroll = () => ({
  scrollY: { get: () => 0, set: () => {} },
  scrollX: { get: () => 0, set: () => {} },
});

export const useScrollInfo = () => ({
  scrollY: { value: 0 },
  scrollX: { value: 0 },
});

export const PanInfo = class PanInfo {};

export const AnimationControls = class AnimationControls {};

export const MotionValue = class MotionValue {
  constructor(public value: any) {}
  set = () => {};
  get = () => this.value;
};

export const withSpring = (toValue: number, _config?: any) => toValue;
export const withTiming = (toValue: number, _config?: any) => toValue;
export const withDelay = (delay: number, animation: any) => animation;
export const withSequence = (...animations: any[]) => animations[animations.length - 1];
export const withRepeat = (animation: number) => animation;
export const withClamp = (animation: number) => animation;
export const withDecay = (toValue: number) => toValue;

export const interpolate = (value: number, inputRange: number[], outputRange: number[]) => {
  if (!inputRange || inputRange.length === 0 || !outputRange || outputRange.length === 0) {
    return outputRange?.[0] ?? 0;
  }
  const firstInput = inputRange[0];
  const lastInput = inputRange[inputRange.length - 1];
  const firstOutput = outputRange[0];
  const lastOutput = outputRange[outputRange.length - 1];
  if (
    firstInput === undefined ||
    lastInput === undefined ||
    firstOutput === undefined ||
    lastOutput === undefined
  ) {
    return 0;
  }
  if (value <= firstInput) return firstOutput;
  if (value >= lastInput) return lastOutput;
  return firstOutput;
};

export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  sin: (t: number) => Math.sin((t * Math.PI) / 2),
  circle: (t: number) => 1 - Math.sqrt(1 - t * t),
  exp: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  back:
    (s = 1.70158) =>
    (t: number) =>
      t * t * ((s + 1) * t - s),
  bounce: (t: number) => t,
  elastic: (bounciness?: number) => (t: number) => t,
  bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => t,
  in: (easing: (t: number) => number) => easing,
  out: (easing: (t: number) => number) => easing,
  inOut: (easing: (t: number) => number) => easing,
};

export const cancelAnimation = () => {};
export const runOnJS = (fn: () => void) => fn;
export const useAnimatedReaction = () => {};
export const useAnimatedProps = (fn: () => any) => {
  try {
    return fn();
  } catch {
    return {};
  }
};
export const useAnimatedGestureHandler = () => {};
export const useAnimatedScrollHandler = () => {};
export const useAnimatedRef = () => ({ current: null });
export const createAnimatedComponent = (component: any) => component;
export const makeMutable = (initial: any) => useMotionValue(initial);
export const makeRemote = (initial: any) => useMotionValue(initial);

export default {
  motion,
  MotionConfig,
  AnimatePresence,
  LayoutGroup,
  useAnimation,
  useMotionValue,
  useTransform,
  useInView,
  useScroll,
  useSpring,
  useMotionTemplate,
  domAnimation,
  useReducedMotion,
  useAnimate,
  useDragControls,
  usePresence,
  useTime,
  useVelocity,
  useAnimationFrame,
  useElementScroll,
  useViewportScroll,
  useScrollInfo,
  PanInfo,
  AnimationControls,
  MotionValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  withClamp,
  withDecay,
  interpolate,
  Extrapolation,
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedProps,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler,
  useAnimatedRef,
  createAnimatedComponent,
  makeMutable,
  makeRemote,
};
