'use client';

import type { CSSProperties, ReactNode, MouseEventHandler } from 'react';
import { useEffect, useRef, useState } from 'react';

interface AnimatedStyleReturn {
  value: unknown;
}

// Accept any style object that could come from useAnimatedStyle or be used as CSS
// Using a permissive type since we convert to CSS at runtime anyway
// react-native-reanimated's useAnimatedStyle returns AnimatedStyle<DefaultStyle>
// where DefaultStyle = ViewStyle | TextStyle | ImageStyle (React Native types)
// Since we're in a web environment, we can't import those types, so we accept any style-like object
export type AnimatedStyle =
  | AnimatedStyleReturn
  | {
      // Match React Native style properties that useAnimatedStyle might return
      opacity?: number;
      transform?: Record<string, number | string>[];
      backgroundColor?: string | number;
      color?: string | number;
      height?: number | string;
      width?: number | string;
      [key: string]: unknown;
    }
  | (() => {
      opacity?: number;
      transform?: Record<string, number | string>[];
      backgroundColor?: string | number;
      color?: string | number;
      height?: number | string;
      width?: number | string;
      [key: string]: unknown;
    })
  | (() => Record<string, unknown>)
  | ((...args: unknown[]) => Record<string, unknown>)
  | Record<string, unknown>
  | undefined;

interface AnimatedViewProps {
  children?: ReactNode;
  style?: AnimatedStyle | Record<string, unknown> | unknown;
  className?: string | undefined;
  onMouseEnter?: MouseEventHandler<HTMLDivElement> | undefined;
  onMouseLeave?: MouseEventHandler<HTMLDivElement> | undefined;
  onClick?: MouseEventHandler<HTMLDivElement> | undefined;
  [key: string]: unknown;
}

function convertToCSSProperties(style: unknown): CSSProperties {
  if (!style || typeof style !== 'object') {
    return {};
  }

  const cssStyle: CSSProperties = {};
  const styleObj = style as Record<string, unknown>;

  if (styleObj['transform'] && Array.isArray(styleObj['transform'])) {
    const transforms: string[] = [];
    styleObj['transform'].forEach((t: unknown) => {
      if (t && typeof t === 'object') {
        const transform = t as Record<string, unknown>;
        if (transform['scale'] !== undefined) {
          transforms.push(`scale(${transform['scale']})`);
        }
        if (transform['translateX'] !== undefined) {
          transforms.push(`translateX(${transform['translateX']}px)`);
        }
        if (transform['translateY'] !== undefined) {
          transforms.push(`translateY(${transform['translateY']}px)`);
        }
        if (transform['rotateX'] !== undefined) {
          transforms.push(`rotateX(${transform['rotateX']})`);
        }
        if (transform['rotateY'] !== undefined) {
          transforms.push(`rotateY(${transform['rotateY']})`);
        }
        if (transform['rotate'] !== undefined) {
          transforms.push(`rotate(${transform['rotate']}deg)`);
        }
      }
    });
    if (transforms.length > 0) {
      cssStyle.transform = transforms.join(' ');
    }
  }

  if (styleObj['opacity'] !== undefined) {
    cssStyle.opacity = Number(styleObj['opacity']);
  }

  if (styleObj['shadowColor'] !== undefined) {
    const shadowOffset = styleObj['shadowOffset'] as
      | { width?: number; height?: number }
      | undefined;
    const shadowRadius = styleObj['shadowRadius'] as number | undefined;
    cssStyle.boxShadow = `${shadowOffset?.width || 0}px ${shadowOffset?.height || 0}px ${shadowRadius || 0}px ${styleObj['shadowColor']}`;
  }

  return cssStyle;
}

export function useAnimatedStyleValue(animatedStyle: AnimatedStyle): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});
  const rafRef = useRef<number | undefined>(undefined);

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
        } else if ('value' in animatedStyle) {
          styleValue = animatedStyle.value;
        } else {
          styleValue = animatedStyle;
        }
        const cssStyle = convertToCSSProperties(styleValue);
        setStyle(cssStyle);
      } catch {
        setStyle({});
      }
      rafRef.current = requestAnimationFrame(updateStyle);
    };

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(updateStyle);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
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
  ...props
}: AnimatedViewProps) {
  const computedStyle = animatedStyle ? useAnimatedStyleValue(animatedStyle as AnimatedStyle) : {};

  return (
    <div
      className={className}
      style={computedStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
