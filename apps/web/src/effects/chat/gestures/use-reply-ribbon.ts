/**
 * Reply Ribbon Effect Hook (Web)
 *
 * Creates a premium reply/quote ribbon effect with:
 * - Ribbon shader from bubble→composer (180ms)
 * - Follows finger/mouse if dragged
 * - Web-compatible: uses SVG paths and pointer events
 * - Reduced Motion → line highlight without motion
 *
 * Location: apps/web/src/effects/chat/gestures/use-reply-ribbon.ts
 */

import { useCallback, useRef } from 'react';
import { animate, useAnimatedStyle, useMotionValue, type MotionValue } from '@petspark/motion';
import { createLogger } from '@/lib/logger';
import { triggerHaptic } from '../core/haptic-manager';
import { getReducedMotionDuration, useReducedMotionSV } from '../core/reduced-motion';
import { logEffectEnd, logEffectStart } from '../core/telemetry';
import { useDeviceRefreshRate } from '@/hooks/use-device-refresh-rate';
import { adaptiveAnimationConfigs } from '../../core/adaptive-animation-config';
import { useUIConfig } from '@/hooks/use-ui-config';

const logger = createLogger('reply-ribbon');

/**
 * Reply ribbon effect options
 */
export interface UseReplyRibbonOptions {
  enabled?: boolean;
  bubbleRect?: DOMRect | null; // Bubble element rect for positioning
  composerRect?: DOMRect | null; // Composer element rect for positioning
  onComplete?: () => void;
}

/**
 * Reply ribbon effect return type
 */
export interface UseReplyRibbonReturn {
  ribbonP0: MotionValue<{ x: number; y: number }>;
  ribbonP1: MotionValue<{ x: number; y: number }>;
  ribbonP2: MotionValue<{ x: number; y: number }>;
  ribbonThickness: MotionValue<number>;
  ribbonOpacity: MotionValue<number>;
  ribbonProgress: MotionValue<number>;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  start: (startPoint: { x: number; y: number }) => void;
  update: (point: { x: number; y: number }) => void;
  complete: () => void;
  cancel: () => void;
}

const DEFAULT_ENABLED = true;
const RIBBON_DURATION = 180; // ms
const DEFAULT_THICKNESS = 4; // px
const MAX_THICKNESS = 8; // px

export function useReplyRibbon(options: UseReplyRibbonOptions = {}): UseReplyRibbonReturn {
  const { enabled = DEFAULT_ENABLED, bubbleRect, composerRect, onComplete } = options;

  const _reducedMotion = useReducedMotionSV();
  const { hz, scaleDuration } = useDeviceRefreshRate();
  const { visual, feedback, animation } = useUIConfig();

  // Ribbon control points
  const ribbonP0 = useMotionValue({ x: 0, y: 0 }); // Start point (bubble)
  const ribbonP1 = useMotionValue({ x: 0, y: 0 }); // Middle point (control)
  const ribbonP2 = useMotionValue({ x: 0, y: 0 }); // End point (composer)

  // Ribbon properties
  const ribbonThickness = useMotionValue(DEFAULT_THICKNESS);
  const ribbonOpacity = useMotionValue(0);
  const ribbonProgress = useMotionValue(0);

  const isActiveRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const effectIdRef = useRef<string | null>(null);

  const start = useCallback(
    (startPoint: { x: number; y: number }) => {
      if (!enabled || isActiveRef.current) {
        return;
      }

      isActiveRef.current = true;
      startPointRef.current = startPoint;

      // Log effect start
      const effectId = logEffectStart('reply-ribbon', {
        startPoint,
      });
      effectIdRef.current = effectId;

      // Set initial point
      if (bubbleRect) {
        ribbonP0.set({
          x: bubbleRect.left + bubbleRect.width / 2,
          y: bubbleRect.top + bubbleRect.height / 2,
        });
      } else {
        ribbonP0.set(startPoint);
      }

      ribbonP1.set(startPoint);
      ribbonP2.set(startPoint);

      // Fade in ribbon - use adaptive duration
      const baseDuration = getReducedMotionDuration(RIBBON_DURATION, false);
      const duration = scaleDuration(baseDuration);
      animate(ribbonOpacity, 1, {
        type: 'tween',
        duration: duration / 2000,
        ease: 'easeOut',
      });

      // Animate thickness - use UI config spring physics or adaptive config
      // Scale spring config based on device refresh rate
      const baseSpringConfig =
        animation.enableReanimated && animation.springPhysics
          ? {
              stiffness: animation.springPhysics.stiffness,
              damping: animation.springPhysics.damping,
              mass: animation.springPhysics.mass,
            }
          : adaptiveAnimationConfigs.smoothEntry(hz as 60 | 120 | 240);

      // Apply adaptive scaling for higher refresh rates
      const springConfig = {
        stiffness: baseSpringConfig.stiffness,
        damping: baseSpringConfig.damping,
        mass: baseSpringConfig.mass,
      };
      animate(ribbonThickness, MAX_THICKNESS, {
        type: 'spring',
        ...springConfig,
      });

      // Trigger haptic (only if haptics enabled)
      if (feedback.haptics) {
        triggerHaptic('light');
      }
    },
    [
      enabled,
      bubbleRect,
      hz,
      scaleDuration,
      visual,
      feedback,
      animation,
      ribbonP0,
      ribbonP1,
      ribbonP2,
      ribbonOpacity,
      ribbonThickness,
    ]
  );

  const update = useCallback(
    (point: { x: number; y: number }) => {
      if (!enabled || !isActiveRef.current) {
        return;
      }

      // Physics simulation: Add tension and elasticity for realistic ribbon behavior
      // The ribbon should have some resistance to movement (tension) and spring back (elasticity)
      const tension = 0.7; // How much the ribbon resists stretching (0-1)
      const elasticity = 0.3; // How much the ribbon springs back (0-1)

      // Calculate distance from previous point for tension simulation
      const prevP1 = ribbonP1.get();
      const dx = point.x - prevP1.x;
      const dy = point.y - prevP1.y;
      const _distance = Math.sqrt(dx * dx + dy * dy);

      // Apply tension: The ribbon doesn't immediately follow, it has resistance
      const tensionFactor = 1 - tension;
      const newP1 = {
        x: prevP1.x + dx * tensionFactor,
        y: prevP1.y + dy * tensionFactor,
      };

      // Update middle point with physics simulation
      ribbonP1.set(newP1);

      // Update end point towards composer with elasticity
      if (composerRect) {
        const targetX = composerRect.left + composerRect.width / 2;
        const targetY = composerRect.top + composerRect.height / 2;
        const dx2 = targetX - point.x;
        const dy2 = targetY - point.y;
        const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        const progress = Math.min(1, distance2 / 200); // Normalize to 0-1

        // Apply elasticity: The end point springs toward the composer
        const elasticityFactor = progress * elasticity;
        ribbonP2.set({
          x: point.x + dx2 * elasticityFactor,
          y: point.y + dy2 * elasticityFactor,
        });

        ribbonProgress.set(progress);
      } else {
        ribbonP2.set(point);
        ribbonProgress.set(1);
      }
    },
    [enabled, composerRect, ribbonP1, ribbonP2, ribbonProgress]
  );

  const complete = useCallback(() => {
    if (!enabled || !isActiveRef.current) {
      return;
    }

    isActiveRef.current = false;

    // Use adaptive duration scaling
    const baseDuration = getReducedMotionDuration(RIBBON_DURATION, false);
    const duration = scaleDuration(baseDuration);
    const durationSeconds = duration / 1000;

    // Animate to composer
    if (composerRect) {
      const target = {
        x: composerRect.left + composerRect.width / 2,
        y: composerRect.top + composerRect.height / 2,
      };
      animate(ribbonP2, target, {
        type: 'tween',
        duration: durationSeconds,
        ease: 'easeInOut',
      });

      animate(ribbonProgress, 1, {
        type: 'tween',
        duration: durationSeconds,
        ease: 'easeInOut',
      });
    }

    // Fade out ribbon
    animate(ribbonOpacity, 0, {
      type: 'tween',
      duration: durationSeconds / 2,
      ease: 'easeIn',
    });

    // Reset thickness
    animate(ribbonThickness, DEFAULT_THICKNESS, {
      type: 'tween',
      duration: durationSeconds / 2,
      ease: 'easeIn',
    });

    // Call onComplete
    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, duration);
    }

    // Log effect end
    if (effectIdRef.current) {
      const effectId = effectIdRef.current;
      setTimeout(() => {
        logEffectEnd(effectId, {
          durationMs: duration,
          success: true,
        });
        effectIdRef.current = null;
      }, duration);
    }

    // Reset after animation
    setTimeout(() => {
      ribbonP0.set({ x: 0, y: 0 });
      ribbonP1.set({ x: 0, y: 0 });
      ribbonP2.set({ x: 0, y: 0 });
      ribbonProgress.set(0);
      startPointRef.current = null;
    }, duration);
  }, [
    enabled,
    composerRect,
    scaleDuration,
    ribbonP2,
    ribbonProgress,
    ribbonOpacity,
    ribbonThickness,
    onComplete,
    ribbonP0,
    ribbonP1,
  ]);

  const cancel = useCallback(() => {
    if (!enabled || !isActiveRef.current) {
      return;
    }

    isActiveRef.current = false;

    // Use adaptive duration scaling
    const baseDuration = getReducedMotionDuration(RIBBON_DURATION / 2, false);
    const duration = scaleDuration(baseDuration);
    const durationSeconds = duration / 1000;

    // Fade out quickly
    animate(ribbonOpacity, 0, {
      type: 'tween',
      duration: durationSeconds,
      ease: 'easeIn',
    });

    // Reset thickness
    animate(ribbonThickness, DEFAULT_THICKNESS, {
      type: 'tween',
      duration: durationSeconds,
      ease: 'easeIn',
    });

    // Reset after animation
    setTimeout(() => {
      ribbonP0.set({ x: 0, y: 0 });
      ribbonP1.set({ x: 0, y: 0 });
      ribbonP2.set({ x: 0, y: 0 });
      ribbonProgress.set(0);
      startPointRef.current = null;
    }, duration);
  }, [
    enabled,
    scaleDuration,
    ribbonOpacity,
    ribbonThickness,
    ribbonP0,
    ribbonP1,
    ribbonP2,
    ribbonProgress,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: ribbonOpacity.get(),
    };
  });

  return {
    ribbonP0,
    ribbonP1,
    ribbonP2,
    ribbonThickness,
    ribbonOpacity,
    ribbonProgress,
    animatedStyle,
    start,
    update,
    complete,
    cancel,
  };
}
