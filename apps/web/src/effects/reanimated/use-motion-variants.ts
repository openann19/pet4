'use client';

import { useCallback, useEffect } from 'react';
import type {
  useMotionValue,
  animate,
  type MotionValue,
  type Variants as FramerVariants,
  MotionStyle } from '@petspark/motion';
import {
  springConfigs,
  timingConfigs,
  _type } from '@/effects/reanimated/transitions';

export interface VariantDefinition {
  opacity?: number;
  scale?: number;
  x?: number;
  y?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  translateX?: number;
  translateY?: number;
  backgroundColor?: string;
  color?: string;
  transition?: {
    type?: 'spring' | 'tween';
    duration?: number;
    delay?: number;
    stiffness?: number;
    damping?: number;
    mass?: number;
    ease?: string | number[];
  };
}

export type Variants = Record<string, VariantDefinition>;

export interface UseMotionVariantsOptions {
  variants?: Variants;
  initial?: string | VariantDefinition;
  animate?: string | VariantDefinition;
  transition?: VariantDefinition['transition'];
  enabled?: boolean;
}

export interface UseMotionVariantsReturn {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  translateX: MotionValue<number>;
  translateY: MotionValue<number>;
  rotate: MotionValue<number>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  backgroundColor: MotionValue<string>;
  color: MotionValue<string>;
  animatedStyle: MotionStyle;
  variants: FramerVariants;
  setVariant: (variant: string) => void;
  setCustomVariant: (variant: VariantDefinition) => void;
}

function getVariantValue(
  variants: Variants | undefined,
  key: string | VariantDefinition | undefined,
  fallback: VariantDefinition = {}
): VariantDefinition {
  if (!key) return fallback;
  if (typeof key === 'string') {
    return variants?.[key] ?? fallback;
  }
  return key;
}

function applyTransition<T extends string | number>(
  value: MotionValue<T>,
  target: T | undefined,
  transition?: VariantDefinition['transition']
): void {
  if (target === undefined) return;
  const delay = transition?.delay ?? 0;
  const duration = transition?.duration;

  if (transition?.type === 'spring') {
    const springConfig = {
      type: 'spring' as const,
      stiffness: transition.stiffness ?? springConfigs.smooth.stiffness ?? 400,
      damping: transition.damping ?? springConfigs.smooth.damping ?? 25,
      mass: transition.mass ?? 1,
    };
    if (delay > 0) {
      animate(value, target, {
        ...springConfig,
        delay: delay / 1000,
      });
    } else {
      animate(value, target, springConfig);
    }
  } else {
    const timingConfig = {
      type: 'tween' as const,
      duration: (duration ?? timingConfigs.smooth.duration ?? 500) / 1000,
      ease: 'easeInOut' as const,
    };
    if (delay > 0) {
      animate(value, target, {
        ...timingConfig,
        delay: delay / 1000,
      });
    } else {
      animate(value, target, timingConfig);
    }
  }
}

export function useMotionVariants(options: UseMotionVariantsOptions = {}): UseMotionVariantsReturn {
  const {
    variants = {},
    initial,
    animate,
    transition: defaultTransition,
    enabled = true,
  } = options;

  const initialVariant = getVariantValue(variants, initial, { opacity: 1, scale: 1 });
  const animateVariant = getVariantValue(variants, animate, { opacity: 1, scale: 1 });

  const opacity = useMotionValue(initialVariant.opacity ?? animateVariant.opacity ?? 1);
  const scale = useMotionValue(initialVariant.scale ?? animateVariant.scale ?? 1);
  const translateX = useMotionValue(
    initialVariant.translateX ??
      initialVariant.x ??
      animateVariant.translateX ??
      animateVariant.x ??
      0
  );
  const translateY = useMotionValue(
    initialVariant.translateY ??
      initialVariant.y ??
      animateVariant.translateY ??
      animateVariant.y ??
      0
  );
  const rotate = useMotionValue(initialVariant.rotate ?? animateVariant.rotate ?? 0);
  const rotateX = useMotionValue(initialVariant.rotateX ?? animateVariant.rotateX ?? 0);
  const rotateY = useMotionValue(initialVariant.rotateY ?? animateVariant.rotateY ?? 0);
  const backgroundColor = useMotionValue(
    initialVariant.backgroundColor ?? animateVariant.backgroundColor ?? 'transparent'
  );
  const color = useMotionValue(initialVariant.color ?? animateVariant.color ?? 'inherit');

  const animatedStyle: MotionStyle = {
    opacity,
    scale,
    x: translateX,
    y: translateY,
    rotate,
    rotateX,
    rotateY,
    backgroundColor,
    color,
  };

  const applyVariant = useCallback(
    (variant: VariantDefinition) => {
      if (!enabled) return;

      const transition = variant.transition ?? defaultTransition;

      if (variant.opacity !== undefined) {
        applyTransition(opacity, variant.opacity, transition);
      }
      if (variant.scale !== undefined) {
        applyTransition(scale, variant.scale, transition);
      }
      if (variant.translateX !== undefined || variant.x !== undefined) {
        applyTransition(translateX, variant.translateX ?? variant.x ?? 0, transition);
      }
      if (variant.translateY !== undefined || variant.y !== undefined) {
        applyTransition(translateY, variant.translateY ?? variant.y ?? 0, transition);
      }
      if (variant.rotate !== undefined) {
        applyTransition(rotate, variant.rotate, transition);
      }
      if (variant.rotateX !== undefined) {
        applyTransition(rotateX, variant.rotateX, transition);
      }
      if (variant.rotateY !== undefined) {
        applyTransition(rotateY, variant.rotateY, transition);
      }
      if (variant.backgroundColor !== undefined) {
        backgroundColor.set(variant.backgroundColor);
      }
      if (variant.color !== undefined) {
        color.set(variant.color);
      }
    },
    [
      enabled,
      defaultTransition,
      opacity,
      scale,
      translateX,
      translateY,
      rotate,
      rotateX,
      rotateY,
      backgroundColor,
      color,
    ]
  );

  useEffect(() => {
    if (enabled && animate) {
      const variant = typeof animate === 'string' ? variants[animate] : animate;
      if (variant) {
        applyVariant(variant);
      }
    }
  }, [enabled, animate, variants, applyVariant]);

  const setVariant = useCallback(
    (variantKey: string) => {
      const variant = variants[variantKey];
      if (variant) {
        applyVariant(variant);
      }
    },
    [variants, applyVariant]
  );

  const setCustomVariant = useCallback(
    (variant: VariantDefinition) => {
      applyVariant(variant);
    },
    [applyVariant]
  );

  // Convert variants to Framer Motion format
  const framerVariants: FramerVariants = {};

  for (const [key, variant] of Object.entries(variants)) {
    const transition = variant.transition ?? defaultTransition;
    const delay = transition?.delay ?? 0;
    const duration = transition?.duration;

    framerVariants[key] = {
      opacity: variant.opacity,
      scale: variant.scale,
      x: variant.translateX ?? variant.x,
      y: variant.translateY ?? variant.y,
      rotate: variant.rotate,
      rotateX: variant.rotateX,
      rotateY: variant.rotateY,
      backgroundColor: variant.backgroundColor,
      color: variant.color,
      transition:
        transition?.type === 'spring'
          ? {
              type: 'spring',
              stiffness: transition.stiffness ?? springConfigs.smooth.stiffness ?? 400,
              damping: transition.damping ?? springConfigs.smooth.damping ?? 25,
              mass: transition.mass ?? 1,
              delay: delay / 1000,
            }
          : {
              type: 'tween',
              duration: (duration ?? timingConfigs.smooth.duration ?? 500) / 1000,
              ease: 'easeInOut',
              delay: delay / 1000,
            },
    };
  }

  return {
    opacity,
    scale,
    translateX,
    translateY,
    rotate,
    rotateX,
    rotateY,
    backgroundColor,
    color,
    animatedStyle,
    variants: framerVariants,
    setVariant,
    setCustomVariant,
  };
}
