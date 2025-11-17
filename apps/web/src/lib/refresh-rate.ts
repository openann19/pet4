/**
 * Refresh Rate Detection
 *
 * Detects display refresh rate (60/120/240 Hz) and provides duration scaling
 * for animations to maintain consistent feel across different refresh rates.
 *
 * Location: apps/web/src/lib/refresh-rate.ts
 */

let rate = 60;

/**
 * Callback type for refresh rate changes
 */
type RefreshRateCallback = (hz: number) => void;

/**
 * Detect display refresh rate using requestAnimationFrame
 *
 * @param cb - Optional callback called when rate is detected/changes
 * @returns Cleanup function to stop detection
 *
 * @example
 * ```typescript
 * const cleanup = detectRefreshRate((hz) => {
 *   // Handle refresh rate detection
 * })
 * // Later: cleanup()
 * ```
 */
export function detectRefreshRate(cb?: RefreshRateCallback): () => void {
  let last = performance.now();
  let frames = 0;
  let animationFrameId: number | null = null;
  let running = true;

  const tick = (t: number): void => {
    if (!running) return;

    frames++;

    if (t - last >= 1000) {
      const detectedRate = Math.min(240, Math.round((frames * 1000) / (t - last)));
      rate = detectedRate;
      frames = 0;
      last = t;
      cb?.(detectedRate);
    }

    animationFrameId = requestAnimationFrame(tick);
  };

  animationFrameId = requestAnimationFrame(tick);

  return (): void => {
    running = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

/**
 * Get current detected refresh rate
 *
 * @returns Refresh rate in Hz (defaults to 60 if not yet detected)
 */
export function hz(): number {
  return rate;
}

/**
 * Scale animation duration based on refresh rate
 *
 * Animations feel faster on higher refresh rates, so we scale durations
 * to maintain consistent perceived speed.
 *
 * @param ms - Base duration in milliseconds (for 60Hz)
 * @returns Scaled duration for current refresh rate
 *
 * @example
 * ```typescript
 * const duration = scaleDuration(260) // 260ms at 60Hz
 * // At 120Hz, returns ~130ms to maintain same perceived speed
 * ```
 */
export function scaleDuration(ms: number): number {
  return Math.round(ms * (60 / rate));
}
