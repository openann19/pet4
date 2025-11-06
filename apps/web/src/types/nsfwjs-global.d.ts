/**
 * Global type declarations for NSFWJS browser UMD build
 * These types are used when NSFWJS is loaded via script tag from CDN
 */

declare global {
  interface Window {
    nsfwjs?: {
      load: (
        urlOrModel?: string,
        opts?: { size?: number; type?: 'graph' | 'layers' }
      ) => Promise<{
        classify: (
          img: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | OffscreenCanvas,
          topK?: number
        ) => Promise<{ className: string; probability: number }[]>;
      }>;
    };
    tf?: unknown;
  }
}

export {};

