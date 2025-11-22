/**
 * Device Score Detection
 *
 * Detects device capabilities (CPU, GPU, memory) to determine performance tier.
 * Used for quality scaling of visual effects.
 *
 * Location: apps/web/src/lib/device-score.ts
 */

import type { DeviceMetrics } from '@petspark/shared';

/**
 * Extended Navigator interface with deviceMemory property
 * Available in Chrome/Edge but not in the standard Navigator type
 */
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/**
 * Type guard to check if navigator has deviceMemory property
 */
function hasDeviceMemory(nav: Navigator): nav is NavigatorWithMemory {
  return 'deviceMemory' in nav && typeof (nav as Record<string, unknown>).deviceMemory === 'number';
}

/**
 * Detect device capabilities and calculate performance score
 *
 * @returns Device metrics with CPU, GPU, and memory scores
 *
 * @example
 * ```typescript
 * const metrics = deviceScore()
 * // { memoryMB: 4096, cpuScore: 2, gpuScore: 2 }
 * ```
 */
export function deviceScore(): DeviceMetrics {
  // Memory detection (Chrome/Edge only)
  const memoryMB =
    hasDeviceMemory(navigator) && navigator.deviceMemory !== undefined
      ? navigator.deviceMemory * 1024
      : undefined;

  // CPU cores
  // hardwareConcurrency can be undefined in some browsers (e.g., older Safari)
  // Use type guard to ensure type safety
  const cores =
    typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const cpuScore = Math.min(3, Math.ceil(cores / 4));

  // GPU detection via WebGL renderer string
  let gpuScore = 1;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const UNMASKED_RENDERER_WEBGL = 0x9246;
        const renderer = gl.getParameter(UNMASKED_RENDERER_WEBGL) as string;

        // Heuristic: longer renderer strings usually indicate more powerful GPUs
        // Score 1-3 based on renderer complexity
        if (renderer) {
          const rendererLength = renderer.length;
          if (rendererLength > 40) {
            gpuScore = 3;
          } else if (rendererLength > 20) {
            gpuScore = 2;
          } else {
            gpuScore = 1;
          }
        }
      }
    }
  } catch {
    // Fallback to default score if WebGL detection fails
    gpuScore = 1;
  }

  return {
    memoryMB: memoryMB ?? 4096, // Default to 4GB if not available
    cpuScore,
    gpuScore,
  };
}
