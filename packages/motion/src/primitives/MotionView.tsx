/**
 * MotionView - Web Implementation
 * Uses Framer Motion for web platform
 */

import { motion } from 'framer-motion'
import { forwardRef, useEffect, useState } from 'react'
import type { ComponentProps, CSSProperties } from 'react'
import type { MotionStyle } from 'framer-motion'

export type MotionViewProps = ComponentProps<typeof motion.div>

// Accept MotionStyle or functions that return style objects
export type AnimatedStyle =
  | MotionStyle
  | (() => MotionStyle)
  | (() => Record<string, unknown>)
  | ((...args: unknown[]) => Record<string, unknown>)
  | Record<string, unknown>
  | undefined;

function useAnimatedStyleValue(animatedStyle: AnimatedStyle): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!animatedStyle) {
      setStyle({});
      return;
    }

    const updateStyle = () => {
      try {
        let styleValue: unknown;
        if (typeof animatedStyle === 'function') {
          styleValue = animatedStyle();
        } else {
          styleValue = animatedStyle;
        }
        if (styleValue && typeof styleValue === 'object' && !Array.isArray(styleValue)) {
          setStyle(styleValue as CSSProperties);
        } else {
          setStyle({});
        }
      } catch {
        setStyle({});
      }
    };

    updateStyle();

    // For dynamic styles (functions), update on animation frame
    if (typeof animatedStyle === 'function') {
      const rafId = requestAnimationFrame(updateStyle);
      return () => cancelAnimationFrame(rafId);
    }
    
    return undefined;
  }, [animatedStyle]);

  return style;
}

/**
 * Web-compatible MotionView using Framer Motion
 * Now supports both MotionStyle and function-based animated styles
 */
export const MotionView = forwardRef<HTMLDivElement, MotionViewProps & { style?: AnimatedStyle | MotionStyle }>(
  function MotionView({ style, ...props }, ref) {
    const computedStyle = style && (typeof style === 'function' || (typeof style === 'object' && 'opacity' in style))
      ? useAnimatedStyleValue(style as AnimatedStyle)
      : (style as MotionStyle | undefined);
    
    return <motion.div ref={ref} {...props} style={computedStyle as MotionStyle} />;
  }
);
