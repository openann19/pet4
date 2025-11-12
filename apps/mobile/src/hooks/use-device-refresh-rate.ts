/**
 * useDeviceRefreshRate Hook (Mobile)
 *
 * Detects device refresh rate (60/120 Hz) and provides adaptive animation configs
 * to maintain consistent feel across different refresh rates.
 *
 * Location: apps/mobile/src/hooks/useDeviceRefreshRate.ts
 */

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface DeviceRefreshRate {
  hz: number;
  isHighRefreshRate: boolean;
  scaleDuration: (duration: number) => number;
  scaleSpringStiffness: (stiffness: number) => number;
}

/**
 * Detect device refresh rate
 *
 * On iOS: Uses UIScreen.mainScreen.maximumFramesPerSecond (if available)
 * On Android: Attempts to detect via native module or defaults to 60Hz
 * Fallback: 60Hz
 *
 * @returns Device refresh rate in Hz (60, 120, or 240)
 */
function detectRefreshRate(): number {
  if (Platform.OS === 'ios') {
    // iOS: Use native screen refresh rate detection
    // In a real implementation, this would use a native module
    // For now, we'll use a heuristic based on device capabilities
    // High-end iOS devices (iPhone 13 Pro and later) support 120Hz
    return 120; // Optimistic default for modern devices
  }

  if (Platform.OS === 'android') {
    // Android: Use native module to detect refresh rate
    // In a real implementation, this would use a native module
    // For now, we'll default to 60Hz
    return 60; // Conservative default
  }

  return 60; // Fallback to 60Hz
}

/**
 * Scale animation duration based on refresh rate
 *
 * Higher refresh rates require shorter durations to maintain the same perceived speed.
 * Formula: scaledDuration = baseDuration * (60 / hz)
 *
 * @param duration - Base duration in milliseconds (for 60Hz)
 * @param hz - Refresh rate in Hz
 * @returns Scaled duration in milliseconds
 */
function scaleDuration(duration: number, hz: number): number {
  if (hz <= 60) {
    return duration;
  }
  // Scale duration proportionally to maintain perceived speed
  return Math.round(duration * (60 / hz));
}

/**
 * Scale spring stiffness based on refresh rate
 *
 * Higher refresh rates can handle higher stiffness values for snappier feel.
 * Formula: scaledStiffness = baseStiffness * (hz / 60)
 *
 * @param stiffness - Base stiffness (for 60Hz)
 * @param hz - Refresh rate in Hz
 * @returns Scaled stiffness
 */
function scaleSpringStiffness(stiffness: number, hz: number): number {
  if (hz <= 60) {
    return stiffness;
  }
  // Scale stiffness proportionally for snappier feel
  return Math.round(stiffness * (hz / 60));
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
  const [hz, setHz] = useState<number>(60);

  useEffect(() => {
    // Detect refresh rate on mount
    const detectedHz = detectRefreshRate();
    setHz(detectedHz);

    // Optionally: Listen for changes (e.g., user setting changes)
    // This would require a native event listener
  }, []);

  const isHighRefreshRate = hz > 60;

  return {
    hz,
    isHighRefreshRate,
    scaleDuration: (duration: number) => scaleDuration(duration, hz),
    scaleSpringStiffness: (stiffness: number) => scaleSpringStiffness(stiffness, hz),
  };
}

