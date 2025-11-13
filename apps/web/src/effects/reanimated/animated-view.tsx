'use client';

import React, { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode, MouseEventHandler } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { convertReanimatedStyleToCSS } from '@petspark/motion';

// Accept any style object that could come from useAnimatedStyle or be used as CSS
// Using a permissive type since we convert to CSS at runtime anyway
export type AnimatedStyle =
  | {
      // Match React Native style properties that useAnimatedStyle might return
      opacity?: number;
      transform?: Record<string, number | string>[];
      backgroundColor?: string | number;
      color?: string | number;
      height?: number | string;
      width?: number | string;
    } & Record<string, unknown>
  | (() => {
      opacity?: number;
      transform?: Record<string, number | string>[];
      backgroundColor?: string | number;
      color?: string | number;
      height?: number | string;
      width?: number | string;
    } & Record<string, unknown>)
  | (() => Record<string, unknown>)
  | ((...args: unknown[]) => Record<string, unknown>)
  | Record<string, unknown>
  | undefined;

interface AnimatedViewProps {
  children?: ReactNode;
  style?: AnimatedStyle | Record<string, unknown>;
  className?: string | undefined;
  onMouseEnter?: MouseEventHandler<HTMLDivElement> | undefined;
  onMouseLeave?: MouseEventHandler<HTMLDivElement> | undefined;
  onClick?: MouseEventHandler<HTMLDivElement> | undefined;
  initial?: boolean | string | number | Record<string, unknown>;
  animate?: string | number | boolean | Record<string, unknown>;
  exit?: string | number | Record<string, unknown>;
  transition?: HTMLMotionProps<'div'>['transition'];
  layout?: boolean | 'position' | 'size';
  layoutId?: string;
  [key: string]: unknown;
}

export function useAnimatedStyleValue(animatedStyle: AnimatedStyle): CSSProperties {
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
          const styleObj = styleValue as Record<string, unknown>;
          try {
            const cssStyle = convertReanimatedStyleToCSS(styleObj as Parameters<typeof convertReanimatedStyleToCSS>[0]);
            if (cssStyle && typeof cssStyle === 'object' && !Array.isArray(cssStyle)) {
              setStyle(cssStyle as CSSProperties);
            } else {
              setStyle({});
            }
          } catch {
            setStyle({});
          }
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
  }, [animatedStyle]);

  return style;
}

export function AnimatedView({
  children,
  style: animatedStyle,
  className,
  onMouseEnter,
  onMouseLeave,
  onClick,
  initial,
  animate,
  exit,
  transition,
  layout,
  layoutId,
  ...props
}: AnimatedViewProps) {
  const computedStyle = animatedStyle ? useAnimatedStyleValue(animatedStyle as AnimatedStyle) : (props.style as CSSProperties | undefined);

  // Extract non-motion props
  const {
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    layout: _layout,
    layoutId: _layoutId,
    style: _style,
    ...domProps
  } = props;

  return (
    <motion.div
      style={computedStyle}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      layout={layout}
      layoutId={layoutId}
      {...domProps}
    >
      {children}
    </motion.div>
  );
}
