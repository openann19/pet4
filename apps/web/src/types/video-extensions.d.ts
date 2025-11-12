/**
 * Video Element Extension Types
 *
 * Type definitions for extended HTMLVideoElement with requestVideoFrameCallback
 */

interface HTMLVideoElementWithRVFC extends HTMLVideoElement {
  requestVideoFrameCallback?: (callback: () => void) => number;
  cancelVideoFrameCallback?: (id: number) => void;
}

declare global {
  interface HTMLVideoElement {
    requestVideoFrameCallback?: (callback: () => void) => number;
    cancelVideoFrameCallback?: (id: number) => void;
  }
}

export type { HTMLVideoElementWithRVFC };
