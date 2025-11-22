/**
 * Animation variants for common UI patterns
 * These are reusable animation configurations that can be applied to MotionView components
 */

interface AnimationVariant {
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  exit: Record<string, number | string>;
  transition: Record<string, number | string>;
}

/**
 * Fade in with upward motion
 */
export const fadeInUp: AnimationVariant = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 300 },
};

/**
 * Fade in with scale effect
 */
export const fadeInScale: AnimationVariant = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 300 },
};

/**
 * Slide in from right
 */
export const slideInFromRight: AnimationVariant = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
  transition: { duration: 300 },
};

/**
 * Slide in from left
 */
export const slideInFromLeft: AnimationVariant = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
  transition: { duration: 300 },
};

/**
 * Elastic pop-in effect
 */
export const elasticPop: AnimationVariant = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  exit: { scale: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 20 },
};
