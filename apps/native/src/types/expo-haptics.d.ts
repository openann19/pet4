/**
 * Type definitions for expo-haptics
 *
 * These types define the structure of the expo-haptics module
 * when imported dynamically.
 */

/**
 * Impact Feedback Style
 */
export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Soft = 'soft',
  Rigid = 'rigid',
}

/**
 * Notification Feedback Type
 */
export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

/**
 * Selection Feedback Type
 */
export enum SelectionFeedbackType {
  Selection = 'selection',
}

/**
 * Haptics API
 */
export interface HapticsAPI {
  impactAsync(style?: ImpactFeedbackStyle): Promise<void>;
  notificationAsync(type: NotificationFeedbackType): Promise<void>;
  selectionAsync(): Promise<void>;
}

/**
 * Expo Haptics Module exports
 */
export interface ExpoHapticsModule {
  default: HapticsAPI;
  impactAsync(style?: ImpactFeedbackStyle): Promise<void>;
  notificationAsync(type: NotificationFeedbackType): Promise<void>;
  selectionAsync(): Promise<void>;
  ImpactFeedbackStyle: typeof ImpactFeedbackStyle;
  NotificationFeedbackType: typeof NotificationFeedbackType;
  SelectionFeedbackType: typeof SelectionFeedbackType;
}

declare module 'expo-haptics' {
  const impactAsync: (style?: ImpactFeedbackStyle) => Promise<void>;
  const notificationAsync: (type: NotificationFeedbackType) => Promise<void>;
  const selectionAsync: () => Promise<void>;
  const ImpactFeedbackStyle: typeof ImpactFeedbackStyle;
  const NotificationFeedbackType: typeof NotificationFeedbackType;
  const SelectionFeedbackType: typeof SelectionFeedbackType;

  const defaultExport: HapticsAPI;

  export default defaultExport;
  export {
    impactAsync,
    notificationAsync,
    selectionAsync,
    ImpactFeedbackStyle,
    NotificationFeedbackType,
    SelectionFeedbackType,
  };
  export type { HapticsAPI, ImpactFeedbackStyle, NotificationFeedbackType, SelectionFeedbackType };
}
