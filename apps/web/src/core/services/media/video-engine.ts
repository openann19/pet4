/**
 * Video Engine Service
 *
 * Provides high-performance video frame callbacks using requestVideoFrameCallback
 * when available (Chrome/Edge), with timeupdate fallback for other browsers.
 *
 * Location: apps/web/src/core/services/media/video-engine.ts
 */

import type {
  EditOptions,
  EditedMedia,
  MediaInput,
  VideoOperation,
} from '@/core/types/media-types';

export type VideoFrameCallback = () => void;

export type VideoFrameCleanup = () => void;

/**
 * Edit video with operations
 * @param input - Video input
 * @param operations - Video operations to apply
 * @param options - Edit options
 * @returns Edited media
 */
export function editVideo(
  input: MediaInput,
  _operations: VideoOperation[],
  _options: EditOptions = {}
): Promise<EditedMedia> {
  // Video editing is not yet implemented
  // For now, return the input as-is
  if (input.type !== 'video') {
    throw new Error('editVideo requires video input');
  }

  return Promise.resolve({
    uri: input.uri,
    type: 'video',
    ...(input.width !== undefined && { width: input.width }),
    ...(input.height !== undefined && { height: input.height }),
    ...(input.durationSec !== undefined && { durationSec: input.durationSec }),
  });
}

/**
 * Subscribe to video frame updates
 * Uses requestVideoFrameCallback when available for 60/120Hz sync
 * Falls back to timeupdate event for compatibility
 *
 * @param videoElement - HTML video element to monitor
 * @param callback - Function called on each frame update
 * @returns Cleanup function to cancel subscription
 */
export function onVideoFrames(
  videoElement: HTMLVideoElement,
  callback: VideoFrameCallback
): VideoFrameCleanup {
  // Check for requestVideoFrameCallback support (Chrome/Edge)
  const rVFC = videoElement.requestVideoFrameCallback;

  if (typeof rVFC === 'function') {
    let frameId: number | null = null;
    let isActive = true;

    const tick = (): void => {
      if (!isActive) return;
      callback();
      frameId = rVFC.call(videoElement, tick);
    };

    // Start the frame loop
    frameId = rVFC.call(videoElement, tick);

    // Return cleanup function
    return () => {
      isActive = false;
      if (frameId !== null && typeof videoElement.cancelVideoFrameCallback === 'function') {
        videoElement.cancelVideoFrameCallback(frameId);
      }
      frameId = null;
    };
  }

  // Fallback to timeupdate event
  const handleTimeUpdate = (): void => {
    callback();
  };

  videoElement.addEventListener('timeupdate', handleTimeUpdate);

  // Return cleanup function
  return () => {
    videoElement.removeEventListener('timeupdate', handleTimeUpdate);
  };
}

/**
 * Get video metadata synchronously if available
 */
export function getVideoMetadata(videoElement: HTMLVideoElement): {
  width: number;
  height: number;
  duration: number;
  currentTime: number;
} | null {
  if (videoElement.readyState >= 2) {
    return {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      duration: videoElement.duration,
      currentTime: videoElement.currentTime,
    };
  }
  return null;
}

/**
 * Check if requestVideoFrameCallback is supported
 */
export function supportsVideoFrameCallback(videoElement: HTMLVideoElement): boolean {
  return typeof videoElement.requestVideoFrameCallback === 'function';
}
