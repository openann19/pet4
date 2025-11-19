'use client';

import React, { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode, MouseEventHandler } from 'react';
import { motion, type HTMLMotionProps, convertReanimatedStyleToCSS, type AnimatedStyle } from '@petspark/motion';

// Use MotionStyle from Framer Motion for full compatibility
import type { MotionStyle } from 'framer-motion';

// Accept MotionStyle or functions that return style objects
export type AnimatedStyle =
  | MotionStyle
  | (() => MotionStyle)
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
  initial?: HTMLMotionProps<'div'>['initial'];
  animate?: HTMLMotionProps<'div'>['animate'];
  exit?: HTMLMotionProps<'div'>['exit'];
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
              setStyle(cssStyle);
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
    
    // No cleanup needed for static styles
    return undefined;
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

  // If onClick is provided, make it keyboard accessible
  const handleKeyDown = onClick
    ? (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }
    : undefined;

  const role = onClick ? 'button' : undefined;
  const tabIndex = onClick ? 0 : undefined;

  return (
    <motion.div
      style={computedStyle}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick ? (e) => void onClick(e) : undefined}
      onKeyDown={handleKeyDown}
      role={role}
      tabIndex={tabIndex}
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
