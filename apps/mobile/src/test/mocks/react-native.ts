import React from 'react'

const MockComponent = ({ children, ...props }: { children?: React.ReactNode }) =>
  React.createElement('View', props, children)

export const Platform = {
  OS: 'ios',
  Version: '14.0',
  select<T extends Record<string, unknown>>(options: T): T[keyof T] | undefined {
    return (options as Record<string, unknown>)['ios'] ?? options['default']
  },
}

export const View = MockComponent
export const Text = MockComponent
export const Pressable = MockComponent
export const TouchableOpacity = MockComponent
export const ScrollView = MockComponent
export const Image = MockComponent
export const ImageBackground = MockComponent
export const ActivityIndicator = MockComponent
export const RefreshControl = MockComponent
export const TextInput = MockComponent
export const Switch = MockComponent

export const StyleSheet = {
  create: (styles: Record<string, unknown>) => styles,
  hairlineWidth: 0.5,
  flatten: <T>(style: T): T => style,
}

export const Dimensions = {
  get: () => ({ width: 375, height: 812 }),
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
}

const noopTiming = () => ({ start: () => {} })

export const Animated = {
  Value: function Value(initial: unknown) {
    this._value = initial
  },
  View: MockComponent,
  Text: MockComponent,
  timing: noopTiming,
  spring: noopTiming,
  sequence: noopTiming,
  parallel: noopTiming,
  loop: noopTiming,
}

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
}

export const AppState = {
  currentState: 'active',
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
}

export const Keyboard = {
  dismiss: () => {},
  addListener: () => ({ remove: () => {} }),
  removeListener: () => {},
}

export const NativeModules: Record<string, unknown> = {}

export class NativeEventEmitter {
  addListener() {
    return { remove: () => {} }
  }

  removeListener() {}
}

export default {
  Platform,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Switch,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  AppState,
  Keyboard,
  NativeModules,
  NativeEventEmitter,
}
