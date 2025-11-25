import React from 'react';

// Mock framer-motion to prevent React context issues in test environment
export const motion = {
  div: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('div', { ...props, ref }, children)
  ),
  span: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('span', { ...props, ref }, children)
  ),
  button: React.forwardRef(({ children, ...props }: any, ref: any) =>
    React.createElement('button', { ...props, ref }, children)
  ),
  form: 'form',
  input: 'input',
  textarea: 'textarea',
  select: 'select',
  option: 'option',
  img: 'img',
  a: 'a',
  ul: 'ul',
  ol: 'ol',
  li: 'li',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  p: 'p',
  section: 'section',
  article: 'article',
  header: 'header',
  footer: 'footer',
  nav: 'nav',
  main: 'main',
  aside: 'aside',
};

export const MotionConfig = ({ children }: { children: React.ReactNode }) => children;
export const AnimatePresence = ({ children }: { children: React.ReactNode }) => children;
export const LayoutGroup = ({ children }: { children: React.ReactNode }) => children;

export const useAnimation = () => ({
  start: vi.fn(() => Promise.resolve()),
  stop: vi.fn(),
});

export const useMotionValue = (initial: any) => ({
  value: initial,
  set: vi.fn(),
  get: () => initial,
});

export const useTransform = (value: any, transform: any) => ({
  value: transform(value.get ? value.get() : value),
  set: vi.fn(),
  get: () => transform(value.get ? value.get() : value),
});

export const useInView = () => false;

export const useScroll = () => ({
  scrollY: { get: () => 0, set: vi.fn() },
  scrollX: { get: () => 0, set: vi.fn() },
});

export const useSpring = () => ({ value: 0 });

export const useMotionTemplate = () => '';

export const domAnimation = {};

export const motionValue = (initial: any) => useMotionValue(initial);

export const useReducedMotion = () => false;

export const useAnimate = () => [vi.fn(), vi.fn(() => Promise.resolve())];

export const useDragControls = () => ({
  start: vi.fn(),
  stop: vi.fn(),
});

export const usePresence = () => [true, null];

export const useTime = () => ({ value: 0 });

export const useVelocity = () => ({ value: 0 });

export const useAnimationFrame = () => ({ value: 0 });

export const useElementScroll = () => ({
  scrollY: { get: () => 0, set: vi.fn() },
  scrollX: { get: () => 0, set: vi.fn() },
});

export const useViewportScroll = () => ({
  scrollY: { get: () => 0, set: vi.fn() },
  scrollX: { get: () => 0, set: vi.fn() },
});

export const useScrollInfo = () => ({
  scrollY: { value: 0 },
  scrollX: { value: 0 },
});

export const PanInfo = class PanInfo {};

export const AnimationControls = class AnimationControls {};

export const MotionValue = class MotionValue {
  constructor(public value: any) {}
  set = vi.fn();
  get = () => this.value;
};

export const TransformProperties = {};

export const MotionProperties = {};

export const useDrag = () => ({
  drag: vi.fn(),
  dragControls: useDragControls(),
});

export const useAnimationControls = () => ({
  start: vi.fn(() => Promise.resolve()),
  stop: vi.fn(),
});

export const useMotionValueEvent = () => vi.fn();

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

export const cancelAnimation = vi.fn();
export const runOnJS = vi.fn((fn: () => void) => fn);
export const useAnimatedReaction = vi.fn();
export const useAnimatedProps = vi.fn((fn: () => any) => {
  try {
    return fn();
  } catch {
    return {};
  }
});
export const useAnimatedGestureHandler = vi.fn();
export const useAnimatedScrollHandler = vi.fn();
export const useAnimatedRef = vi.fn(() => ({ current: null }));
export const createAnimatedComponent = vi.fn((component: any) => component);
export const makeMutable = vi.fn((initial: any) => useMotionValue(initial));
export const makeRemote = vi.fn((initial: any) => useMotionValue(initial));

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
  TransformProperties,
  MotionProperties,
  useDrag,
  useAnimationControls,
  useMotionValueEvent,
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
