import type { MotionStyle } from '@petspark/motion';

export type MotionSurfaceKind = 'interaction' | 'presence' | 'status' | 'celebration' | 'layout';

export interface BaseMotionReturn<TStyle extends MotionStyle | Record<string, unknown>> {
  kind: MotionSurfaceKind;
  /**
   * Fully merged style object that can be passed directly to MotionView / AnimatedView.
   * No nested MotionValue fragments are exposed in the public contract.
   */
  animatedStyle: TStyle;
}

export interface InteractionMotion<TStyle extends MotionStyle | Record<string, unknown>>
  extends BaseMotionReturn<TStyle> {
  kind: 'interaction';
  onPressIn?: () => void;
  onPressOut?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}

export interface PresenceMotion<TStyle extends MotionStyle | Record<string, unknown>>
  extends BaseMotionReturn<TStyle> {
  kind: 'presence';
  isVisible: boolean;
}

export interface CelebrationMotion<TStyle extends MotionStyle | Record<string, unknown>>
  extends BaseMotionReturn<TStyle> {
  kind: 'celebration';
  trigger: () => void;
}

export interface StatusMotion<TStyle extends MotionStyle | Record<string, unknown>>
  extends BaseMotionReturn<TStyle> {
  kind: 'status';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}
