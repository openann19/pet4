/**
 * Type declarations for react-native
 * Used for web compatibility when module is not available
 * Provides minimal type definitions for web polyfills
 */

declare module 'react-native' {
  import type { ComponentType, ReactNode } from 'react';

  export type ViewProps = {
    style?: unknown;
    children?: ReactNode;
  } & Record<string, unknown>;

  export type TextProps = {
    style?: unknown;
    children?: ReactNode;
  } & Record<string, unknown>;

  export type ImageProps = {
    source: { uri: string } | number;
    style?: unknown;
    resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  } & Record<string, unknown>;

  export interface StyleSheet {
    create<T extends Record<string, unknown>>(styles: T): T;
  }

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const Image: ComponentType<ImageProps>;
  export const StyleSheet: StyleSheet;
  export const Platform: {
    OS: 'web' | 'ios' | 'android';
    select<T>(spec: Record<string, T>): T;
  };

  export const Dimensions: {
    get(dimension: 'window' | 'screen'): { width: number; height: number };
    addEventListener(
      type: 'change',
      handler: (dimensions: {
        window: { width: number; height: number };
        screen: { width: number; height: number };
      }) => void
    ): void;
    removeEventListener(
      type: 'change',
      handler: (dimensions: {
        window: { width: number; height: number };
        screen: { width: number; height: number };
      }) => void
    ): void;
  };

  export function findNodeHandle(componentOrHandle: unknown): number | null;

  export type ImageSource = { uri: string } | number;

  export type ViewStyle = Record<string, unknown>;

  export type TextStyle = Record<string, unknown>;

  export type ImageStyle = Record<string, unknown>;
}
