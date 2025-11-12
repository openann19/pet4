import { forwardRef, useMemo } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

interface HoverStyle {
  scale?: number;
  opacity?: number;
  rotate?: number;
  translateX?: number;
  translateY?: number;
}

// Extract all valid HTML div attributes while excluding motion-specific props
type DivAttributes = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onMouseEnter' | 'onMouseLeave' | 'onMouseDown' | 'onMouseUp' | 'onClick' | 'onTouchStart' | 'onTouchEnd'
>;

interface MotionViewWebProps extends DivAttributes {
  children?: React.ReactNode;
  animatedStyle?: never;
  whileHover?: HoverStyle;
  whileTap?: HoverStyle;
  initial?: Variants | boolean | Variants['initial'];
  animate?: Variants['animate'] | Variants | boolean;
  exit?: Variants['exit'] | Variants;
  transition?: HTMLMotionProps<'div'>['transition'];
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
  onMouseUp?: React.MouseEventHandler<HTMLDivElement>;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onTouchStart?: React.TouchEventHandler<HTMLDivElement>;
  onTouchEnd?: React.TouchEventHandler<HTMLDivElement>;
}

/**
 * Web-specific MotionView component using framer-motion.
 * Properly filters non-DOM props to prevent React warnings.
 * Supports whileHover, whileTap, initial, animate, exit, and transition props.
 *
 * Note: On web builds, MotionView.web.tsx will be automatically resolved first
 * by the build system. This file serves as a fallback.
 */
export const MotionView: ForwardRefExoticComponent<
  MotionViewWebProps & RefAttributes<HTMLDivElement>
> = forwardRef<HTMLDivElement, MotionViewWebProps>(
  (
    {
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      transition,
      animatedStyle: _animatedStyle, // Explicitly ignore animatedStyle prop
      ...restProps
    },
    ref
  ) => {
    // Map HoverStyle to framer-motion format
    // Filter out undefined values to avoid passing undefined to framer-motion
    const mappedWhileHover = useMemo(() => {
      if (!whileHover) {
        return undefined;
      }
      const mapped: Record<string, number> = {};
      if (whileHover.scale !== undefined) {
        mapped.scale = whileHover.scale;
      }
      if (whileHover.opacity !== undefined) {
        mapped.opacity = whileHover.opacity;
      }
      if (whileHover.rotate !== undefined) {
        mapped.rotate = whileHover.rotate;
      }
      if (whileHover.translateX !== undefined) {
        mapped.x = whileHover.translateX;
      }
      if (whileHover.translateY !== undefined) {
        mapped.y = whileHover.translateY;
      }
      return Object.keys(mapped).length > 0 ? mapped : undefined;
    }, [whileHover]);

    const mappedWhileTap = useMemo(() => {
      if (!whileTap) {
        return undefined;
      }
      const mapped: Record<string, number> = {};
      if (whileTap.scale !== undefined) {
        mapped.scale = whileTap.scale;
      }
      if (whileTap.opacity !== undefined) {
        mapped.opacity = whileTap.opacity;
      }
      if (whileTap.rotate !== undefined) {
        mapped.rotate = whileTap.rotate;
      }
      if (whileTap.translateX !== undefined) {
        mapped.x = whileTap.translateX;
      }
      if (whileTap.translateY !== undefined) {
        mapped.y = whileTap.translateY;
      }
      return Object.keys(mapped).length > 0 ? mapped : undefined;
    }, [whileTap]);

    // restProps contains all valid HTML div attributes
    // framer-motion's motion.div will handle these correctly and won't pass
    // motion-specific props (whileHover, whileTap, initial, animate, etc.) to the DOM
    // We explicitly extract animatedStyle above to ensure it's not passed through
    // Also explicitly exclude whileHover and whileTap from restProps to prevent DOM leakage

    // Filter out any motion-specific props that might have leaked into restProps
    const {
      whileHover: _whileHover,
      whileTap: _whileTap,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      animatedStyle: _animatedStyleProp,
      ...domProps
    } = restProps as typeof restProps & {
      whileHover?: unknown;
      whileTap?: unknown;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      animatedStyle?: unknown;
    };

    return (
      <motion.div
        ref={ref}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
        whileHover={mappedWhileHover}
        whileTap={mappedWhileTap}
        {...domProps}
      >
        {children}
      </motion.div>
    );
  }
);

MotionView.displayName = 'MotionView';
