import { motion, type HTMLMotionProps, type Variants, type VariantLabels } from 'framer-motion';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { forwardRef, useMemo } from 'react';

interface HoverStyle {
  scale?: number;
  opacity?: number;
  rotate?: number;
  translateX?: number;
  translateY?: number;
  x?: number;
  y?: number;
}

type AsTag = 'div' | 'button';

// Extract all valid HTML div attributes while excluding motion-specific props
type DivAttributes = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onMouseDown'
  | 'onMouseUp'
  | 'onClick'
  | 'onTouchStart'
  | 'onTouchEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
>;

type ButtonAttributes = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onMouseDown'
  | 'onMouseUp'
  | 'onClick'
  | 'onTouchStart'
  | 'onTouchEnd'
>;

interface MotionViewCommonProps {
  children?: React.ReactNode;
  animatedStyle?: Record<string, unknown> | object | Record<string, unknown>[];
  whileHover?: HoverStyle | string | VariantLabels;
  whileTap?: HoverStyle | string | VariantLabels;
  initial?: Variants | boolean | Variants['initial'] | string | VariantLabels;
  animate?: Variants['animate'] | Variants | boolean | string | VariantLabels;
  exit?: Variants['exit'] | Variants;
  variants?: Variants;
  transition?: HTMLMotionProps<'div'>['transition'];
  as?: AsTag;
  // Framer-motion advanced props (web-oriented, no-ops on RN)
  layout?: boolean | 'position' | 'size';
  layoutId?: string;
  onHoverStart?: (event: MouseEvent, info: unknown) => void;
  onHoverEnd?: (event: MouseEvent, info: unknown) => void;
  onTapStart?: (event: MouseEvent | TouchEvent | PointerEvent, info: unknown) => void;
  onTap?: (event: MouseEvent | TouchEvent | PointerEvent, info: unknown) => void;
  onTapCancel?: (event: MouseEvent | TouchEvent | PointerEvent, info: unknown) => void;
  drag?: boolean | 'x' | 'y';
  dragConstraints?: unknown;
  dragElastic?: number;
  dragMomentum?: boolean;
  onDragStart?: (event: MouseEvent | TouchEvent | PointerEvent, info: unknown) => void;
  onDrag?: (event: MouseEvent | TouchEvent | PointerEvent, info: unknown) => void;
  onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: unknown) => void;
}

type MotionViewWebProps =
  | (MotionViewCommonProps &
    DivAttributes & {
      as?: 'div';
      onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
      onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
      onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
      onMouseUp?: React.MouseEventHandler<HTMLDivElement>;
      onClick?: React.MouseEventHandler<HTMLDivElement>;
      onTouchStart?: React.TouchEventHandler<HTMLDivElement>;
      onTouchEnd?: React.TouchEventHandler<HTMLDivElement>;
    })
  | (MotionViewCommonProps &
    ButtonAttributes & {
      as: 'button';
      onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
      onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
      onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
      onMouseUp?: React.MouseEventHandler<HTMLButtonElement>;
      onClick?: React.MouseEventHandler<HTMLButtonElement>;
      onTouchStart?: React.TouchEventHandler<HTMLButtonElement>;
      onTouchEnd?: React.TouchEventHandler<HTMLButtonElement>;
    });

/**
 * Web-specific MotionView component using framer-motion.
 * Properly filters non-DOM props to prevent React warnings.
 * Supports whileHover, whileTap, initial, animate, exit, and transition props.
 *
 * Note: On web builds, MotionView.web.tsx will be automatically resolved first
 * by the build system. This file serves as a fallback.
 */
export const MotionView: ForwardRefExoticComponent<
  MotionViewWebProps & RefAttributes<HTMLDivElement | HTMLButtonElement>
> = forwardRef<HTMLDivElement | HTMLButtonElement, MotionViewWebProps>(
  (
    {
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      variants,
      transition,
      animatedStyle: _animatedStyle,
      as = 'div',
      layout,
      layoutId,
      onHoverStart,
      onHoverEnd,
      onTapStart,
      onTap,
      onTapCancel,
      drag,
      dragConstraints,
      dragElastic,
      dragMomentum,
      onDragStart,
      onDrag,
      onDragEnd,
      ...restProps
    },
    ref
  ) => {
    // Type guard to check if value is a HoverStyle object
    const isHoverStyle = (value: HoverStyle | string | VariantLabels | undefined): value is HoverStyle => {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    };

    const mappedWhileHover = useMemo(() => {
      if (!whileHover) return undefined;
      // If it's a string or array (variant key), pass it through directly
      if (typeof whileHover === 'string' || Array.isArray(whileHover)) {
        return whileHover;
      }
      // Otherwise, map HoverStyle object to framer-motion format
      if (isHoverStyle(whileHover)) {
        const mapped: Record<string, number> = {};
        if (whileHover.scale !== undefined) mapped.scale = whileHover.scale;
        if (whileHover.opacity !== undefined) mapped.opacity = whileHover.opacity;
        if (whileHover.rotate !== undefined) mapped.rotate = whileHover.rotate;
        if (whileHover.translateX !== undefined) mapped.x = whileHover.translateX;
        if (whileHover.translateY !== undefined) mapped.y = whileHover.translateY;
        return Object.keys(mapped).length > 0 ? mapped : undefined;
      }
      return undefined;
    }, [whileHover]);

    const mappedWhileTap = useMemo(() => {
      if (!whileTap) return undefined;
      // If it's a string or array (variant key), pass it through directly
      if (typeof whileTap === 'string' || Array.isArray(whileTap)) {
        return whileTap;
      }
      // Otherwise, map HoverStyle object to framer-motion format
      if (isHoverStyle(whileTap)) {
        const mapped: Record<string, number> = {};
        if (whileTap.scale !== undefined) mapped.scale = whileTap.scale;
        if (whileTap.opacity !== undefined) mapped.opacity = whileTap.opacity;
        if (whileTap.rotate !== undefined) mapped.rotate = whileTap.rotate;
        if (whileTap.translateX !== undefined) mapped.x = whileTap.translateX;
        if (whileTap.translateY !== undefined) mapped.y = whileTap.translateY;
        return Object.keys(mapped).length > 0 ? mapped : undefined;
      }
      return undefined;
    }, [whileTap]);

    const {
      whileHover: _whileHover,
      whileTap: _whileTap,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      variants: _variants,
      transition: _transition,
      animatedStyle: _animatedStyleProp,
      as: _asConsumed,
      ...domProps
    } = restProps as typeof restProps & {
      whileHover?: unknown;
      whileTap?: unknown;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      variants?: unknown;
      transition?: unknown;
      animatedStyle?: unknown;
      as?: unknown;
    };

    const Comp = as === 'button' ? motion.button : motion.div;

    // Build props object conditionally to satisfy exactOptionalPropertyTypes
    // Only include props that are defined (not undefined)
    const motionProps = {
      ...domProps,
      ...(initial !== undefined && { initial }),
      ...(animate !== undefined && { animate }),
      ...(exit !== undefined && { exit }),
      ...(variants !== undefined && { variants }),
      ...(transition !== undefined && { transition }),
      ...(mappedWhileHover !== undefined && { whileHover: mappedWhileHover }),
      ...(mappedWhileTap !== undefined && { whileTap: mappedWhileTap }),
      ...(layout !== undefined && { layout }),
      ...(layoutId !== undefined && { layoutId }),
      ...(onHoverStart !== undefined && { onHoverStart }),
      ...(onHoverEnd !== undefined && { onHoverEnd }),
      ...(onTapStart !== undefined && { onTapStart }),
      ...(onTap !== undefined && { onTap }),
      ...(onTapCancel !== undefined && { onTapCancel }),
      ...(drag !== undefined && { drag }),
      ...(dragConstraints !== undefined && { dragConstraints }),
      ...(dragElastic !== undefined && { dragElastic }),
      ...(dragMomentum !== undefined && { dragMomentum }),
      ...(onDragStart !== undefined && { onDragStart }),
      ...(onDrag !== undefined && { onDrag }),
      ...(onDragEnd !== undefined && { onDragEnd }),
    };

    return (
      <Comp ref={ref as never} {...(motionProps as HTMLMotionProps<'div'>)}>
        {children}
      </Comp>
    );
  }
);

MotionView.displayName = 'MotionView';
