/**
 * Type definitions for react-native-reanimated layout animations
 * These extend the base types to include layout animation APIs
 */

import type { BaseAnimationBuilder } from 'react-native-reanimated';

declare module 'react-native-reanimated' {
  interface BaseAnimationBuilder {
    delay(ms: number): BaseAnimationBuilder;
    duration(ms: number): BaseAnimationBuilder;
  }

  export const FadeIn: BaseAnimationBuilder;
  export const FadeOut: BaseAnimationBuilder;
  export const SlideInDown: BaseAnimationBuilder;
  export const SlideOutDown: BaseAnimationBuilder;
  export const SlideInUp: BaseAnimationBuilder;
  export const SlideOutUp: BaseAnimationBuilder;
  export const SlideInLeft: BaseAnimationBuilder;
  export const SlideOutLeft: BaseAnimationBuilder;
  export const SlideInRight: BaseAnimationBuilder;
  export const SlideOutRight: BaseAnimationBuilder;
}

export {};

