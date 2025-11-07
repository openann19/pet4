/**
 * Type declarations for nsfwjs/dist/nsfwjs.min.js browser build
 * This is the browser-compatible minified build that avoids Node.js dependencies
 */
declare module 'nsfwjs/dist/nsfwjs.min.js' {
  export interface NSFWJS {
    load(): Promise<NSFWJS>
    classify(
      input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageData | OffscreenCanvas,
      topk?: number
    ): Promise<Array<{ className: string; probability: number }>>
  }

  export default NSFWJS
  export { NSFWJS }
}

