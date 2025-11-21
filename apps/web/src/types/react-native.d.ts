/**
 * Type declarations for react-native
 * Used for web compatibility when module is not available
 * Provides minimal type definitions for web polyfills
 */

declare module 'react-native' {
  import type { ComponentType, ReactNode } from 'react';

  export interface ViewProps extends Record<string, unknown> {
    style?: unknown;
    children?: ReactNode;
  }

  export interface TextProps extends Record<string, unknown> {
    style?: unknown;
    children?: ReactNode;
  }

  export interface ImageProps extends Record<string, unknown> {
    source: { uri: string } | number;
    style?: unknown;
    resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  }

  export interface GestureResponderEvent {
    readonly nativeEvent?: Record<string, unknown>;
    readonly bubbles?: boolean;
  }

  export interface PressableProps extends ViewProps {
    onPress?: (event: GestureResponderEvent) => void;
    disabled?: boolean;
    android_ripple?: unknown;
  }

  export interface TouchableOpacityProps extends ViewProps {
    onPress?: (event: GestureResponderEvent) => void;
    activeOpacity?: number;
    disabled?: boolean;
  }

  export interface TextInputProps extends TextProps {
    onChangeText?: (text: string) => void;
    value?: string;
    placeholder?: string;
    secureTextEntry?: boolean;
    multiline?: boolean;
  }

  export interface ScrollViewProps extends ViewProps {
    contentContainerStyle?: unknown;
    horizontal?: boolean;
    showsVerticalScrollIndicator?: boolean;
    showsHorizontalScrollIndicator?: boolean;
  }

  export interface StyleSheet {
    hairlineWidth: number;
    absoluteFill: ViewStyle;
    absoluteFillObject: ViewStyle;
    create<T extends Record<string, unknown>>(styles: T): T;
  }

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const Image: ComponentType<ImageProps>;
  export const Pressable: ComponentType<PressableProps>;
  export const TouchableOpacity: ComponentType<TouchableOpacityProps>;
  export const TextInput: ComponentType<TextInputProps>;
  export const ScrollView: ComponentType<ScrollViewProps>;
  export const ActivityIndicator: ComponentType<{ size?: number | 'small' | 'large'; color?: string }>;
  export const KeyboardAvoidingView: ComponentType<ViewProps & { behavior?: 'height' | 'position' | 'padding' }>;
  export const Modal: ComponentType<ViewProps & { visible?: boolean; transparent?: boolean; animationType?: 'none' | 'slide' | 'fade'; onRequestClose?: () => void }>;
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

  export const Linking: {
    openURL(url: string): Promise<void>;
    canOpenURL(url: string): Promise<boolean>;
  };
}
