/**
 * React Native SVG Type Definitions
 *
 * Minimal type definitions for react-native-svg to support SVG rendering
 * in React Native components. This provides type safety for SVG components.
 */

import type { ComponentType, ReactNode } from 'react';
import type { ViewProps, StyleProp, ViewStyle } from 'react-native';

interface SvgProps extends ViewProps {
  width?: number | string;
  height?: number | string;
  viewBox?: string;
  preserveAspectRatio?: string;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

interface CircleProps {
  cx?: number | string;
  cy?: number | string;
  r?: number | string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  opacity?: number;
  fillOpacity?: number;
  strokeOpacity?: number;
}

interface DefsProps {
  children?: ReactNode;
}

interface LinearGradientProps {
  id?: string;
  x1?: number | string;
  y1?: number | string;
  x2?: number | string;
  y2?: number | string;
  children?: ReactNode;
}

interface StopProps {
  offset?: number | string;
  stopColor?: string;
  stopOpacity?: number;
}

declare module 'react-native-svg' {
  export const Svg: ComponentType<SvgProps>;
  export const Circle: ComponentType<CircleProps>;
  export const Defs: ComponentType<DefsProps>;
  export const LinearGradient: ComponentType<LinearGradientProps>;
  export const Stop: ComponentType<StopProps>;
}
