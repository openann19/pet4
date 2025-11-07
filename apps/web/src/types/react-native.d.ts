/**
 * Type declarations for react-native
 * Used for web compatibility when module is not available
 * Provides minimal type definitions for web polyfills
 */

declare module 'react-native' {
  import type { ComponentType } from 'react'

  export interface ViewProps {
    style?: unknown
    children?: React.ReactNode
    [key: string]: unknown
  }

  export interface TextProps {
    style?: unknown
    children?: React.ReactNode
    [key: string]: unknown
  }

  export interface ImageProps {
    source: { uri: string } | number
    style?: unknown
    resizeMode?: 'contain' | 'cover' | 'stretch' | 'center'
    [key: string]: unknown
  }

  export interface StyleSheet {
    create<T extends Record<string, unknown>>(styles: T): T
  }

  export const View: ComponentType<ViewProps>
  export const Text: ComponentType<TextProps>
  export const Image: ComponentType<ImageProps>
  export const StyleSheet: StyleSheet
  export const Platform: {
    OS: 'web' | 'ios' | 'android'
    select<T>(spec: { [key: string]: T }): T
  }

  export const Dimensions: {
    get(dimension: 'window' | 'screen'): { width: number; height: number }
    addEventListener(
      type: 'change',
      handler: (dimensions: { window: { width: number; height: number }; screen: { width: number; height: number } }) => void
    ): void
    removeEventListener(
      type: 'change',
      handler: (dimensions: { window: { width: number; height: number }; screen: { width: number; height: number } }) => void
    ): void
  }

  export function findNodeHandle(componentOrHandle: unknown): number | null

  export type ImageSource = { uri: string } | number

  export interface ViewStyle {
    [key: string]: unknown
  }

  export interface TextStyle {
    [key: string]: unknown
  }

  export interface ImageStyle {
    [key: string]: unknown
  }
}

