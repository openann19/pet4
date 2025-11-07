import { isTruthy, isDefined } from '@/core/guards';

/**
 * Browser-only dynamic loader for NSFWJS + TFJS (avoids bundling Node deps)
 * 
 * Loads NSFWJS and TensorFlow.js from CDN at runtime to avoid bundling
 * Node-only dependencies like gif-encoder, @nsfw-filter/gif-frames, etc.
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

let modelPromise: Promise<{
  classify: (
    img: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | OffscreenCanvas,
    topK?: number
  ) => Promise<{ className: string; probability: number }[]>;
}> | null = null;

/**
 * Load a script dynamically
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    const existingScript = document.querySelector(`script[src="${String(src ?? '')}"]`);
    if (isTruthy(existingScript)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => { resolve(); };
    script.onerror = () => { reject(new Error(`Failed to load script: ${String(src ?? '')}`)); };
    document.head.appendChild(script);
  });
}

/**
 * Loads NSFWJS model once and returns a ready model instance.
 * 
 * Default uses bundled model from CDN; provide modelUrl to use a hosted model.
 * 
 * @param modelUrl - Optional URL to hosted model (e.g., '/nsfw-model/inception_v3/')
 * @param opts - Optional model options (e.g., { size: 299, type: 'graph' })
 * @returns Promise resolving to model with classify method
 * @throws Error if called outside browser or if scripts fail to load
 */
export async function loadNSFWModel(
  modelUrl?: string,
  opts?: { size?: number; type?: 'graph' | 'layers' }
): Promise<{
  classify: (
    img: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | OffscreenCanvas,
    topK?: number
  ) => Promise<{ className: string; probability: number }[]>;
}> {
  if (typeof window === 'undefined') {
    throw new Error('loadNSFWModel must run in the browser');
  }

  modelPromise ??= (async () => {
    // Load TensorFlow.js first (required dependency)
    if (!window.tf) {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
    }

    // Load NSFWJS
    if (!window.nsfwjs) {
      await loadScript('https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/nsfwjs.min.js');
    }

    // Verify nsfwjs is available
    if (!window.nsfwjs || typeof window.nsfwjs.load !== 'function') {
      throw new Error('NSFWJS failed to load or is invalid');
    }

    // Load the model
    // If modelUrl is omitted, nsfwjs loads its bundled model by default.
    // Provide modelUrl + opts to use a hosted model (smaller network cost, cacheable shards).
    const model = await window.nsfwjs.load(modelUrl, opts);

    if (!model || typeof model.classify !== 'function') {
      throw new Error('NSFWJS model loaded but classify method is missing');
    }

    return model;
  })();

  return modelPromise;
}

/**
 * Convenience wrapper to classify an image element
 * 
 * @param el - Image element to classify
 * @param topK - Number of top predictions to return (default: 5)
 * @returns Promise resolving to array of predictions
 */
export async function classify(
  el: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | OffscreenCanvas,
  topK = 5
): Promise<{ className: string; probability: number }[]> {
  const model = await loadNSFWModel();
  return model.classify(el, topK);
}

/**
 * Reset the model promise (for testing only)
 * @internal
 */
export function __resetForTests(): void {
  modelPromise = null;
}

