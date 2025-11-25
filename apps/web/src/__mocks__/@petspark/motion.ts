/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-redundant-type-constituents */
import React from 'react';

// Mock @petspark/motion to prevent React context issues in test environment
export const MotionView = React.forwardRef(
  (
    { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
    ref: React.Ref<HTMLElement>
  ) => React.createElement('div', { ...props, ref }, children)
);

export const MotionConfig = ({ children }: { children?: React.ReactNode }) => children ?? null;

export const AnimatePresence = ({ children }: { children?: React.ReactNode }) => children ?? null;

export const motion = {
  div: React.forwardRef(
    (
      { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
      ref: React.Ref<HTMLElement>
    ) => React.createElement('div', { ...props, ref }, children)
  ),
  span: React.forwardRef(
    (
      { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
      ref: React.Ref<HTMLElement>
    ) => React.createElement('span', { ...props, ref }, children)
  ),
  button: React.forwardRef(
    (
      { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
      ref: React.Ref<HTMLElement>
    ) => React.createElement('button', { ...props, ref }, children)
  ),
  form: 'form',
  input: 'input',
  textarea: 'textarea',
  label: 'label',
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
  a: 'a',
  img: React.forwardRef(
    (
      { children, ...props }: { children?: React.ReactNode; [key: string]: unknown },
      ref: React.Ref<HTMLElement>
    ) => React.createElement('img', { ...props, ref }, children)
  ),
  section: 'section',
  article: 'article',
  header: 'header',
  footer: 'footer',
  nav: 'nav',
  main: 'main',
  aside: 'aside',
};

export const useMotionValue = (initial: unknown) => ({
  value: initial,
  get: () => initial,
  set: vi.fn(),
  onChange: vi.fn(),
});

export const useSpring = () => ({ value: 0 });

export const useTransform = (
  value: { get?: () => unknown } | unknown,
  transform: (val: unknown) => unknown
) => {
  const val =
    value && typeof value === 'object' && 'get' in value && typeof value.get === 'function'
      ? value.get()
      : value;
  return {
    value: transform(val),
    set: vi.fn(),
    get: () => transform(val),
  };
};

export const useAnimation = () => ({
  start: vi.fn(),
  stop: vi.fn(),
});

export const usePresence = () => [true, null];

export const useInView = () => false;

export const useScroll = () => ({
  scrollY: { get: () => 0, set: vi.fn() },
  scrollX: { get: () => 0, set: vi.fn() },
});

export const useAnimate = () => [vi.fn(), vi.fn(() => Promise.resolve())];

export const useMotionValueEvent = () => vi.fn();

export const useReducedMotion = () => false;

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

export const withSpring = (toValue: number, _config?: unknown) => toValue;

export const withTiming = (toValue: number, _config?: unknown) => toValue;

export const withDelay = (delay: number, animation: unknown) => animation;

export const LayoutGroup = ({ children }: { children?: React.ReactNode }) => children ?? null;

export const domAnimation = {};

export const motionValue = (initial: unknown) => useMotionValue(initial);

export const AnimateSharedLayout = ({ children }: { children?: React.ReactNode }) =>
  children ?? null;

export const LazyMotion = ({ children }: { children?: React.ReactNode }) => children ?? null;

export const m = motion;

export const useDragControls = () => ({
  start: vi.fn(),
  stop: vi.fn(),
});

export const PanInfo = {};

export const DragControls = {};

export const useDragGesture = () => ({});

export const useGesture = () => ({});

export const useMotionTemplate = () => '';

export const useScrollInfo = () => ({
  scrollY: { value: 0 },
  scrollX: { value: 0 },
});
