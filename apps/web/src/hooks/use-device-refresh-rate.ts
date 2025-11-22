/**
 * useDeviceRefreshRate Hook (Web)
 *
 * Detects device refresh rate (60/120/240 Hz) and provides adaptive animation configs
 * to maintain consistent feel across different refresh rates.
 *
 * Location: apps/web/src/hooks/useDeviceRefreshRate.ts
 */

import { useEffect, useState } from 'react';
import { detectRefreshRate, hz } from '@/lib/refresh-rate';
import {
  detectDeviceCapability,
  scaleDuration,
  scaleSpringStiffness,
  type DeviceHz,
} from '@/effects/core/adaptive-animation-config';

export interface DeviceRefreshRate {
  hz: number;
  isHighRefreshRate: boolean;
  isUltraHighRefreshRate: boolean;
  deviceCapability: {
    isLowEnd: boolean;
    isMidRange: boolean;
    isHighEnd: boolean;
    maxParticles: number;
    supportsAdvancedEffects: boolean;
  };
  scaleDuration: (duration: number) => number;
  scaleSpringStiffness: (stiffness: number) => number;
}

/**
 * Hook to access device refresh rate and adaptive animation configs
 *
 * @example
 * ```tsx
 * const { hz, isHighRefreshRate, scaleDuration } = useDeviceRefreshRate()
 * const animationDuration = scaleDuration(300) // 150ms on 120Hz, 300ms on 60Hz
 * ```
 */
export function useDeviceRefreshRate(): DeviceRefreshRate {
  const [refreshHz, setRefreshHz] = useState<number>(60);

  useEffect(() => {
    // Start detection
    const cleanup = detectRefreshRate((detectedHz) => {
      // Clamp to valid DeviceHz values (60, 120, or 240)
      const clampedHz: DeviceHz = detectedHz >= 240 ? 240 : detectedHz >= 120 ? 120 : 60;
      setRefreshHz(clampedHz);
    });

    // Get initial rate and clamp to valid DeviceHz
    const initialHz = hz();
    const clampedHz: DeviceHz = initialHz >= 240 ? 240 : initialHz >= 120 ? 120 : 60;
    setRefreshHz(clampedHz);

    return cleanup;
  }, []);

  const clampedHz: DeviceHz = refreshHz >= 240 ? 240 : refreshHz >= 120 ? 120 : 60;
  const isHighRefreshRate = clampedHz > 60;
  const isUltraHighRefreshRate = clampedHz >= 240;
  const deviceCapability = detectDeviceCapability(clampedHz);

  return {
    hz: clampedHz,
    isHighRefreshRate,
    isUltraHighRefreshRate,
    deviceCapability,
    scaleDuration: (duration: number) => scaleDuration(duration, clampedHz),
    scaleSpringStiffness: (stiffness: number) => scaleSpringStiffness(stiffness, clampedHz),
  };
}
