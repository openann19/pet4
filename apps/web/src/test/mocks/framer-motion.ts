import React from 'react';

// Simple component factory that doesn't rely on React internals during mock creation
const createSimpleComponent = (tag: string) => {
  const Component = React.forwardRef<any, any>(({ children, ...props }, ref) => {
    return React.createElement(tag, { ...props, ref }, children);
  });
  Component.displayName = `Motion.${tag}`;
  return Component;
};

// Create all motion components
const motionComponents = {
  div: createSimpleComponent('div'),
  span: createSimpleComponent('span'),
  button: createSimpleComponent('button'),
  form: createSimpleComponent('form'),
  input: createSimpleComponent('input'),
  textarea: createSimpleComponent('textarea'),
  label: createSimpleComponent('label'),
  ul: createSimpleComponent('ul'),
  ol: createSimpleComponent('ol'),
  li: createSimpleComponent('li'),
  h1: createSimpleComponent('h1'),
  h2: createSimpleComponent('h2'),
  h3: createSimpleComponent('h3'),
  h4: createSimpleComponent('h4'),
  h5: createSimpleComponent('h5'),
  h6: createSimpleComponent('h6'),
  p: createSimpleComponent('p'),
  a: createSimpleComponent('a'),
  img: createSimpleComponent('img'),
  section: createSimpleComponent('section'),
  article: createSimpleComponent('article'),
  header: createSimpleComponent('header'),
  footer: createSimpleComponent('footer'),
  nav: createSimpleComponent('nav'),
  main: createSimpleComponent('main'),
  aside: createSimpleComponent('aside'),
};

// Simple provider components that just render children
const MotionConfig = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

const AnimatePresence = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

const LayoutGroup = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

// Export everything that framer-motion provides
export {
  motionComponents as motion,
  MotionConfig,
  AnimatePresence,
  LayoutGroup,
};

// Animation functions
export const animate = () => Promise.resolve();

// Hooks
export const useMotionValue = (initial: any) => ({
  value: initial,
  get: () => initial,
  set: () => {},
  onChange: () => {},
});

export const useTransform = (value: any, transform: any) => ({
  value: transform(value.get ? value.get() : value),
  set: () => {},
  get: () => transform(value.get ? value.get() : value),
});

export const useSpring = () => ({ value: 0 });
export const useAnimation = () => ({
  start: () => {},
  stop: () => {},
});
export const usePresence = () => [true, null];
export const useInView = () => false;
export const useScroll = () => ({
  scrollY: { get: () => 0, set: () => {} },
  scrollX: { get: () => 0, set: () => {} },
});
export const useAnimate = () => [() => {}, () => Promise.resolve()];
export const useMotionValueEvent = () => () => {};
export const useReducedMotion = () => false;
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

// Animation utilities
export const withSpring = (toValue: number) => toValue;
export const withTiming = (toValue: number) => toValue;
export const withDelay = (delay: number, animation: any) => animation;
export const withRepeat = (animation: any, times?: number) => animation;
export const withSequence = (...animations: any[]) => animations[animations.length - 1];

// Additional exports
export const domAnimation = {};
export const motionValue = (initial: any) => ({
  value: initial,
  get: () => initial,
  set: () => {},
});
export const AnimateSharedLayout = ({ children }: { children: React.ReactNode }) => children;
export const LazyMotion = ({ children }: { children: React.ReactNode }) => children;

// Drag controls
export const useDragControls = () => ({
  start: () => {},
  stop: () => {},
});

// Types (empty objects for type compatibility)
export const PanInfo = {};
export const DragControls = {};

// Default export
export default {
  motion: motionComponents,
  MotionConfig,
  AnimatePresence,
  LayoutGroup,
  animate,
  useMotionValue,
  useTransform,
  useSpring,
  useAnimation,
  usePresence,
  useInView,
  useScroll,
  useAnimate,
  useMotionValueEvent,
  useReducedMotion,
  useTime,
  useVelocity,
  useAnimationFrame,
  useElementScroll,
  useViewportScroll,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  domAnimation,
  motionValue,
  AnimateSharedLayout,
  LazyMotion,
  useDragControls,
  PanInfo,
  DragControls,
};
