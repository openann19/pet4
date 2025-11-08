/**
 * Type declarations for expo-haptics
 * This is an optional dependency that may not be available in all environments
 */

declare module 'expo-haptics' {
  export enum ImpactFeedbackStyle {
    Light = 1,
    Medium = 2,
    Heavy = 3,
  }

  export enum NotificationFeedbackType {
    Success = 1,
    Warning = 2,
    Error = 3,
  }

  export enum SelectionFeedbackStyle {
    Light = 0,
    Medium = 1,
    Heavy = 2,
  }

  export function impactAsync(style?: ImpactFeedbackStyle): Promise<void>
  export function notificationAsync(type: NotificationFeedbackType): Promise<void>
  export function selectionAsync(): Promise<void>

  export default {
    impactAsync,
    notificationAsync,
    selectionAsync,
    ImpactFeedbackStyle,
    NotificationFeedbackType,
    SelectionFeedbackStyle,
  }
}
