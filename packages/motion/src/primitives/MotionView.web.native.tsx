import { forwardRef, useMemo, useEffect, useState } from 'react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { motion, type HTMLMotionProps, type Variants, type VariantLabels } from 'framer-motion';
import type { CSSProperties } from 'react';
import { convertTransformToStyle } from '../framer-api/useMotionStyle';

interface HoverStyle {
  scale?: number;
  opacity?: number;
  rotate?: number;
  translateX?: number;
  translateY?: number;
}

// Reanimated-style animated style type
type AnimatedStyle = 
  | (() => CSSProperties | { transform?: Array<{ [key: string]: number | string }>; [key: string]: unknown })
  | CSSProperties
  | { transform?: Array<{ [key: string]: number | string }>; [key: string]: unknown }
  | undefined;

// Extract all valid HTML div attributes while excluding motion-specific props
type DivAttributes = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onMouseEnter' | 'onMouseLeave' | 'onMouseDown' | 'onMouseUp' | 'onClick' | 'onTouchStart' | 'onTouchEnd'
>;

interface MotionViewWebProps extends DivAttributes {
  children?: React.ReactNode;
  animatedStyle?: AnimatedStyle;
  whileHover?: HoverStyle | string | VariantLabels;
  whileTap?: HoverStyle | string | VariantLabels;
  initial?: Variants | boolean | Variants['initial'] | string | VariantLabels;
  animate?: Variants['animate'] | Variants | boolean | string | VariantLabels;
  exit?: Variants['exit'] | Variants;
  variants?: Variants;
  transition?: HTMLMotionProps<'div'>['transition'];
  layout?: boolean | 'position' | 'size';
  layoutId?: string;
  layoutDependency?: unknown;
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
      variants,
      transition,
      animatedStyle,
      layout,
      layoutId,
      layoutDependency,
      ...restProps
    },
    ref
  ) => {
    // Convert animatedStyle to Framer Motion style
    const [computedStyle, setComputedStyle] = useState<CSSProperties>({})
    
    useEffect(() => {
      if (!animatedStyle) {
        setComputedStyle({})
        return undefined
      }

      const updateStyle = () => {
        try {
          let styleValue: CSSProperties | { transform?: { [key: string]: number | string }[]; [key: string]: unknown }
          
          if (typeof animatedStyle === 'function') {
            styleValue = animatedStyle() as CSSProperties
          } else {
            styleValue = animatedStyle as CSSProperties
          }

          // Convert Reanimated transform format to CSS
          if (styleValue && typeof styleValue === 'object' && 'transform' in styleValue && Array.isArray(styleValue.transform)) {
            const transformStyle = convertTransformToStyle(styleValue.transform)
            const { transform: _, ...rest } = styleValue
            setComputedStyle({ ...rest, ...transformStyle } as CSSProperties)
          } else {
            setComputedStyle(styleValue as CSSProperties)
          }
        } catch {
          setComputedStyle({})
        }
      }

      updateStyle()
      
      // For dynamic styles, we'd need to subscribe to changes
      // For now, we'll update on every render if it's a function
      if (typeof animatedStyle === 'function') {
        const rafId = requestAnimationFrame(updateStyle)
        return () => {
          if (rafId) cancelAnimationFrame(rafId)
        }
      }
      
      return undefined
    }, [animatedStyle, layoutDependency])
    
    // Type guard to check if value is a HoverStyle object
    const isHoverStyle = (value: HoverStyle | string | VariantLabels | undefined): value is HoverStyle => {
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    };

    // Map HoverStyle to framer-motion format, or pass through string variant keys
    // Filter out undefined values to avoid passing undefined to framer-motion
    const mappedWhileHover = useMemo(() => {
      if (!whileHover) {
        return undefined;
      }
      // If it's a string or array (variant key), pass it through directly
      if (typeof whileHover === 'string' || Array.isArray(whileHover)) {
        return whileHover;
      }
      // Otherwise, map HoverStyle object to framer-motion format
      if (isHoverStyle(whileHover)) {
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
      }
      return undefined;
    }, [whileHover]);

    const mappedWhileTap = useMemo(() => {
      if (!whileTap) {
        return undefined;
      }
      // If it's a string or array (variant key), pass it through directly
      if (typeof whileTap === 'string' || Array.isArray(whileTap)) {
        return whileTap;
      }
      // Otherwise, map HoverStyle object to framer-motion format
      if (isHoverStyle(whileTap)) {
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
      }
      return undefined;
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

    // Merge computed style from animatedStyle with any existing style prop
    const mergedStyle = useMemo(() => {
      const existingStyle = restProps.style as CSSProperties | undefined
      if (!animatedStyle) {
        return existingStyle
      }
      return { ...computedStyle, ...existingStyle }
    }, [computedStyle, animatedStyle, restProps.style])

    return (
      <motion.div
        ref={ref}
        initial={initial as HTMLMotionProps<'div'>['initial']}
        animate={animate as HTMLMotionProps<'div'>['animate']}
        exit={exit as HTMLMotionProps<'div'>['exit']}
        variants={variants}
        transition={transition}
        whileHover={mappedWhileHover}
        whileTap={mappedWhileTap}
        layout={layout}
        layoutId={layoutId}
        style={mergedStyle}
        {...domProps}
      >
        {children}
      </motion.div>
    );
  }
);

MotionView.displayName = 'MotionView';
