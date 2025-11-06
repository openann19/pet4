export { MotionView } from './primitives/MotionView';
export { MotionText } from './primitives/MotionText';
export { MotionScrollView } from './primitives/MotionScrollView';

export { usePressBounce } from './recipes/usePressBounce';
export { useHoverLift } from './recipes/useHoverLift';       // web gracefully no-op on mobile
export { useMagnetic } from './recipes/useMagnetic';
export { useParallax } from './recipes/useParallax';
export { useShimmer } from './recipes/useShimmer';
export { useRipple } from './recipes/useRipple';
export { haptic } from './recipes/haptic';

export { usePageTransitions, Presence } from './transitions/presence';
export { motion } from './tokens';

// Reduced motion utilities
export { usePerfBudget } from './usePerfBudget'
export type { PerfBudget } from './usePerfBudget'

export {
  useReducedMotion,
  useReducedMotionSV,
  isReduceMotionEnabled,
  getReducedMotionDuration,
  getReducedMotionMultiplier,
} from './reduced-motion';
