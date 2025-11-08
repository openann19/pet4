/**
 * Video Frame Callback Hook
 *
 * Uses requestVideoFrameCallback for smooth video scrubbing at display refresh rate.
 * Falls back to 'timeupdate' event for browsers without rVFC support.
 *
 * Location: apps/web/src/hooks/useVideoFrames.ts
 */

import { useEffect, type RefObject } from 'react';

/**
 * Hook to receive video frame callbacks at display refresh rate
 *
 * Uses requestVideoFrameCallback when available for buttery smooth updates.
 * Falls back to 'timeupdate' event for compatibility.
 *
 * @param videoRef - Ref to video element
 * @param callback - Callback invoked on each frame/timeupdate
 *
 * @example
 * ```tsx
 * const videoRef = useRef<HTMLVideoElement>(null)
 *
 * useVideoFrames(videoRef, () => {
 *   // Update overlay/scrubber at display refresh rate
 *   updateOverlay(videoRef.current?.currentTime)
 * })
 * ```
 */
export function useVideoFrames(videoRef: RefObject<HTMLVideoElement>, callback: () => void): void {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check for requestVideoFrameCallback support
    const rVFC = (video as { requestVideoFrameCallback?: (callback: () => void) => number })
      .requestVideoFrameCallback;

    if (typeof rVFC === 'function') {
      // Use rVFC for smooth frame callbacks
      let frameId: number | null = null;

      const loop = (): void => {
        callback();
        frameId = rVFC(loop);
      };

      frameId = rVFC(loop);

      return () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
      };
    } else {
      // Fallback to timeupdate event
      const handleTimeUpdate = (): void => {
        callback();
      };

      video.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [videoRef, callback]);
}
