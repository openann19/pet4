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

  export interface Haptics {
    impactAsync(style?: ImpactFeedbackStyle): Promise<void>
    notificationAsync(type?: NotificationFeedbackType): Promise<void>
    selectionAsync(): Promise<void>
  }

  export const impactAsync: (style?: ImpactFeedbackStyle) => Promise<void>
  export const notificationAsync: (type?: NotificationFeedbackType) => Promise<void>
  export const selectionAsync: () => Promise<void>

  const haptics: Haptics
  export default haptics
}
