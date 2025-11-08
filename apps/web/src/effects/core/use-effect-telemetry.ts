/**
 * Effect Telemetry Hook
 *
 * Tracks effect performance metrics: duration, dropped frames, device Hz
 * Logs to structured logger (no PII)
 */

import { useRef, useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

const logger = createLogger('EffectTelemetry');

export interface EffectTelemetryEvent {
  effect: string;
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  droppedFrames?: number;
  deviceHz?: number;
  reducedMotion: boolean;
  success: boolean;
}

export interface UseEffectTelemetryOptions {
  effectName: string;
  enabled?: boolean;
}

export interface UseEffectTelemetryReturn {
  start: () => void;
  end: (success?: boolean) => void;
  getDeviceHz: () => number;
}

let deviceHzCache: number | null = null;

function getDeviceHz(): number {
  if (deviceHzCache !== null) {
    return deviceHzCache;
  }

  // Try to detect refresh rate
  if (typeof window !== 'undefined' && 'screen' in window) {
    const screen = window.screen;
    if ('refreshRate' in screen && typeof screen.refreshRate === 'number') {
      deviceHzCache = screen.refreshRate;
      return deviceHzCache;
    }
  }

  // Default to 60Hz
  deviceHzCache = 60;
  return deviceHzCache;
}

/**
 * Hook to track effect telemetry
 */
export function useEffectTelemetry(options: UseEffectTelemetryOptions): UseEffectTelemetryReturn {
  const { effectName, enabled = true } = options;
  const reducedMotion = usePrefersReducedMotion();
  const startTimeRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!enabled) {
      return;
    }

    startTimeRef.current = performance.now();
    frameCountRef.current = 0;
    lastFrameTimeRef.current = null;

    // Track frame timing
    const trackFrame = (timestamp: number) => {
      if (lastFrameTimeRef.current !== null) {
        const frameDelta = timestamp - lastFrameTimeRef.current;
        const expectedFrameTime = 1000 / getDeviceHz();

        // If frame took significantly longer, count as dropped
        if (frameDelta > expectedFrameTime * 1.5) {
          frameCountRef.current += Math.floor(frameDelta / expectedFrameTime - 1);
        }
      }

      lastFrameTimeRef.current = timestamp;
      requestAnimationFrame(trackFrame);
    };

    requestAnimationFrame(trackFrame);
  }, [enabled]);

  const end = useCallback(
    (success = true) => {
      if (!enabled || startTimeRef.current === null) {
        return;
      }

      const endedAt = performance.now();
      const durationMs = endedAt - startTimeRef.current;
      const droppedFrames = frameCountRef.current;
      const deviceHz = getDeviceHz();

      const event: EffectTelemetryEvent = {
        effect: effectName,
        startedAt: startTimeRef.current,
        endedAt,
        durationMs,
        droppedFrames,
        deviceHz,
        reducedMotion,
        success,
      };

      logger.info('Effect completed', {
        effect: event.effect,
        durationMs: event.durationMs,
        droppedFrames: event.droppedFrames,
        deviceHz: event.deviceHz,
        reducedMotion: event.reducedMotion,
        success: event.success,
      });

      // Reset
      startTimeRef.current = null;
      frameCountRef.current = 0;
      lastFrameTimeRef.current = null;
    },
    [enabled, effectName, reducedMotion]
  );

  return {
    start,
    end,
    getDeviceHz,
  };
}
