import { useMemo } from 'react';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { useUIContext } from '@/contexts/UIContext';

export type MotionLevel = 'full' | 'reduced' | 'off';

export interface MotionPreferences {
  level: MotionLevel;
  isReduced: boolean;
  isOff: boolean;
}

/**
 * Common options surface for motion hooks.
 *
 * Hooks can accept a precomputed preferences object (for easier testing)
 * and a flag to bypass preference logic entirely when needed.
 */
export interface MotionHookOptions {
  preferences?: MotionPreferences;
  respectPreferences?: boolean;
}

export function useMotionPreferences(override?: Partial<MotionPreferences>): MotionPreferences {
  const prefersReduced = usePrefersReducedMotion();
  const { config } = useUIContext();

  const uiLevel = (config.animation as { motionLevel?: MotionLevel }).motionLevel;

  const baseLevel: MotionLevel = uiLevel ?? (prefersReduced ? 'reduced' : 'full');

  const derived: MotionPreferences = useMemo(() => {
    const level: MotionLevel = override?.level ?? baseLevel;
    return {
      level,
      isReduced: level !== 'full',
      isOff: level === 'off',
    };
  }, [baseLevel, override?.level]);

  return derived;
}
