import { useCallback, useRef, useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { WebGLContextManager } from '@/lib/webgl-utils';
import { getWorkerPool } from '@/lib/worker-pool';
import {
  MediaProcessorError,
  WebGLError,
  ShaderCompilationError,
  TextureError,
  createErrorContext,
  type MediaErrorContext,
} from '@/lib/media-errors';
import { getPerformanceMonitor } from '@/lib/performance-monitor';

const logger = createLogger('MediaProcessor');

/**
 * Ultra-advanced media processor core engine
 * Handles canvas operations, video frame manipulation, WebGL shaders
 * Enhanced with structured logging, worker pools, WebGL optimization, and performance monitoring
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MediaAsset {
  readonly id: string;
  readonly type: 'image' | 'video' | 'audio';
  readonly url: string;
  readonly file?: File;
  readonly width: number;
  readonly height: number;
  readonly duration?: number; // For video/audio in seconds
  readonly thumbnail?: string;
  readonly metadata?: MediaMetadata;
}

export interface MediaMetadata {
  readonly format: string;
  readonly codec?: string;
  readonly bitrate?: number;
  readonly frameRate?: number;
  readonly aspectRatio: number;
  readonly size: number;
  readonly createdAt: Date;
}

export interface ProcessingOptions {
  readonly quality: 'low' | 'medium' | 'high' | 'ultra';
  readonly format: 'jpeg' | 'png' | 'webp' | 'mp4' | 'webm';
  readonly compression: number; // 0-1
  readonly preserveAlpha: boolean;
  readonly maxDimension?: number;
}

export interface CanvasOperation {
  readonly type: 'crop' | 'resize' | 'rotate' | 'flip' | 'filter' | 'composite';
  readonly params: Record<string, unknown>;
  readonly blend?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
  readonly opacity?: number;
}

export interface VideoFrame {
  readonly timestamp: number;
  readonly data: ImageData;
  readonly index: number;
}

export interface ProcessingProgress {
  readonly stage: 'loading' | 'processing' | 'encoding' | 'complete';
  readonly progress: number; // 0-100
  readonly currentFrame?: number;
  readonly totalFrames?: number;
  readonly message?: string;
}

export interface ShaderProgram {
  readonly name: string;
  readonly vertexShader: string;
  readonly fragmentShader: string;
  readonly uniforms: Record<string, unknown>;
}

// ============================================================================
// Constants
// ============================================================================

const _QUALITY_SETTINGS = {
  low: { scale: 0.5, quality: 0.6, maxFPS: 24 },
  medium: { scale: 0.75, quality: 0.8, maxFPS: 30 },
  high: { scale: 1.0, quality: 0.92, maxFPS: 60 },
  ultra: { scale: 1.0, quality: 0.98, maxFPS: 120 },
} as const;

const _MAX_CANVAS_SIZE = 8192; // WebGL max texture size
const _FRAME_BUFFER_SIZE = 30; // Number of frames to buffer for smooth playback
const _WORKER_POOL_SIZE = navigator.hardwareConcurrency || 4;

// Default vertex shader for 2D operations
const _DEFAULT_VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Default fragment shader (passthrough)
const _DEFAULT_FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
`;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMediaProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglManagerRef = useRef<WebGLContextManager | null>(null);
  const _operationHistoryRef = useRef<CanvasOperation[]>([]);
  const performanceMonitor = getPerformanceMonitor();
  const _workerPool = getWorkerPool();

  // ============================================================================
  // WebGL Initialization
  // ============================================================================

  const initializeWebGL = useCallback((): WebGLContextManager => {
    if (!webglManagerRef.current) {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = 1920;
        canvasRef.current.height = 1080;
      }

      try {
        webglManagerRef.current = new WebGLContextManager(canvasRef.current, {
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        });

        logger.info('WebGL context initialized', {
          isWebGL2: webglManagerRef.current.isWebGL2Context(),
        });
      } catch (err) {
        const errorContext = createErrorContext('webgl-init', {
          error: err instanceof Error ? err.message : String(err),
        });
        throw new WebGLError('Failed to initialize WebGL', errorContext, false);
      }
    }

    return webglManagerRef.current;
  }, []);

  // ============================================================================
  // Shader Compilation
  // ============================================================================

  const createShaderProgram = useCallback(
    (vertexSource: string, fragmentSource: string, cacheKey?: string): ReturnType<WebGLContextManager['createShaderProgram']> => {
      try {
        const webglManager = initializeWebGL();
        return webglManager.createShaderProgram(vertexSource, fragmentSource, cacheKey);
      } catch (err) {
        const errorContext = createErrorContext('shader-compilation', {
          vertexSource: vertexSource.substring(0, 100),
          fragmentSource: fragmentSource.substring(0, 100),
          error: err instanceof Error ? err.message : String(err),
        });
        throw new ShaderCompilationError('Failed to compile shader', errorContext, false);
      }
    },
    [initializeWebGL]
  );

  // ============================================================================
  // Texture Management
  // ============================================================================

  const createTexture = useCallback(
    (
      image: HTMLImageElement | HTMLVideoElement | ImageData | HTMLCanvasElement,
      cacheKey?: string
    ): WebGLTexture => {
      try {
        const webglManager = initializeWebGL();
        return webglManager.createTexture(image, {}, cacheKey);
      } catch (err) {
        const errorContext = createErrorContext('texture-creation', {
          width: image instanceof ImageData ? image.width : image.width,
          height: image instanceof ImageData ? image.height : image.height,
          error: err instanceof Error ? err.message : String(err),
        });
        throw new TextureError('Failed to create texture', errorContext, false);
      }
    },
    [initializeWebGL]
  );

  // ============================================================================
  // Canvas Operations
  // ============================================================================

  const loadImage = useCallback(
    (url: string): Promise<HTMLImageElement> => {
      return performanceMonitor.measureOperation('load-image', async () => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            logger.info('Image loaded', { url, width: img.width, height: img.height });
            resolve(img);
          };
          img.onerror = () => {
            const errorContext = createErrorContext('load-image', { url });
            const error = new MediaProcessorError('Failed to load image', errorContext, false);
            logger.error('Failed to load image', error, errorContext);
            reject(error);
          };
          img.src = url;
        });
      });
    },
    [performanceMonitor]
  );

  const loadVideo = useCallback(
    (url: string): Promise<HTMLVideoElement> => {
      return performanceMonitor.measureOperation('load-video', async () => {
        return new Promise<HTMLVideoElement>((resolve, reject) => {
          const video = document.createElement('video');
          video.crossOrigin = 'anonymous';
          video.preload = 'auto';

          video.onloadedmetadata = () => {
            video.currentTime = 0;
          };

          video.onseeked = () => {
            logger.info('Video loaded', {
              url,
              width: video.videoWidth,
              height: video.videoHeight,
              duration: video.duration,
            });
            resolve(video);
          };

          video.onerror = () => {
            const errorContext = createErrorContext('load-video', { url });
            const error = new MediaProcessorError('Failed to load video', errorContext, false);
            logger.error('Failed to load video', error, errorContext);
            reject(error);
          };
          video.src = url;
          video.load();
        });
      });
    },
    [performanceMonitor]
  );

  const extractVideoFrame = useCallback(
    async (video: HTMLVideoElement, timestamp: number): Promise<ImageData> => {
      return performanceMonitor.measureOperation('extract-video-frame', async () => {
        return new Promise<ImageData>((resolve, reject) => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            const errorContext = createErrorContext('extract-video-frame', {
              timestamp,
              width: video.videoWidth,
              height: video.videoHeight,
            });
            const error = new MediaProcessorError('Failed to get 2D context', errorContext, false);
            logger.error('Failed to extract video frame', error, errorContext);
            reject(error);
            return;
          }

          video.currentTime = timestamp;
          video.onseeked = () => {
            try {
              ctx.drawImage(video, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              resolve(imageData);
            } catch (err) {
              const errorContext = createErrorContext('extract-video-frame', {
                timestamp,
                error: err instanceof Error ? err.message : String(err),
              });
              const error = new MediaProcessorError('Failed to extract frame', errorContext, false);
              logger.error('Failed to extract video frame', error, errorContext);
              reject(error);
            }
          };
        });
      });
    },
    [performanceMonitor]
  );

  // ============================================================================
  // Image Processing Operations
  // ============================================================================

  const cropImage = useCallback((
    source: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    ctx.drawImage(source, x, y, width, height, 0, 0, width, height);
    return canvas;
  }, []);

  const resizeImage = useCallback((
    source: HTMLImageElement | HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number,
    _options: { algorithm?: 'bilinear' | 'bicubic' | 'lanczos' } = {}
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Use imageSmoothingQuality for better results
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // For high-quality downscaling, use step-down approach
    if (targetWidth < source.width / 2 || targetHeight < source.height / 2) {
      let currentCanvas: HTMLCanvasElement | HTMLImageElement = source;
      let currentWidth = source.width;
      let currentHeight = source.height;

      while (currentWidth > targetWidth * 2 || currentHeight > targetHeight * 2) {
        currentWidth = Math.max(targetWidth, Math.floor(currentWidth / 2));
        currentHeight = Math.max(targetHeight, Math.floor(currentHeight / 2));

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = currentWidth;
        tempCanvas.height = currentHeight;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) {
          break;
        }

        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(currentCanvas, 0, 0, currentWidth, currentHeight);
        currentCanvas = tempCanvas;
      }

      ctx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);
    } else {
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    }

    return canvas;
  }, []);

  const rotateImage = useCallback((
    source: HTMLImageElement | HTMLCanvasElement,
    degrees: number
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const radians = (degrees * Math.PI) / 180;

    // Calculate new dimensions after rotation
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const newWidth = Math.floor(source.width * cos + source.height * sin);
    const newHeight = Math.floor(source.width * sin + source.height * cos);

    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Translate to center, rotate, then translate back
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(source, -source.width / 2, -source.height / 2);

    return canvas;
  }, []);

  const flipImage = useCallback((
    source: HTMLImageElement | HTMLCanvasElement,
    horizontal: boolean,
    vertical: boolean
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    ctx.save();
    ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
    ctx.drawImage(
      source,
      horizontal ? -source.width : 0,
      vertical ? -source.height : 0
    );
    ctx.restore();

    return canvas;
  }, []);

  // ============================================================================
  // Advanced Processing with WebGL
  // ============================================================================

  const applyShader = useCallback(
    (source: HTMLImageElement | HTMLCanvasElement, shader: ShaderProgram): HTMLCanvasElement => {
      return performanceMonitor.measureOperationSync('apply-shader', () => {
        try {
          const webglManager = initializeWebGL();
          const gl = webglManager.getGL();
          const shaderProgram = createShaderProgram(shader.vertexShader, shader.fragmentShader, shader.name);

          // Set canvas size to match source
          if (canvasRef.current) {
            canvasRef.current.width = source.width;
            canvasRef.current.height = source.height;
          }

          gl.viewport(0, 0, source.width, source.height);
          gl.useProgram(shaderProgram.program);

          // Create and bind texture
          const texture = createTexture(source, `shader_source_${source.width}x${source.height}`);

          // Set up geometry (two triangles forming a quad)
          const positionBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
          );

          const texCoordBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]),
            gl.STATIC_DRAW
          );

          // Set attributes
          const positionLocation = shaderProgram.attributes.get('a_position');
          const texCoordLocation = shaderProgram.attributes.get('a_texCoord');

          if (positionLocation !== undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
          }

          if (texCoordLocation !== undefined) {
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
            gl.enableVertexAttribArray(texCoordLocation);
            gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
          }

          // Set uniforms
          const imageLocation = shaderProgram.uniforms.get('u_image');
          if (imageLocation !== undefined) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(imageLocation, 0);
          }

          // Set custom uniforms from shader
          Object.entries(shader.uniforms).forEach(([name, value]) => {
            const location = shaderProgram.uniforms.get(name);
            if (location !== undefined) {
              if (typeof value === 'number') {
                gl.uniform1f(location, value);
              } else if (Array.isArray(value)) {
                if (value.length === 2) {
                  gl.uniform2fv(location, new Float32Array(value));
                } else if (value.length === 3) {
                  gl.uniform3fv(location, new Float32Array(value));
                } else if (value.length === 4) {
                  gl.uniform4fv(location, new Float32Array(value));
                }
              }
            }
          });

          // Draw
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

          // Copy result to new canvas
          const resultCanvas = document.createElement('canvas');
          resultCanvas.width = source.width;
          resultCanvas.height = source.height;
          const resultCtx = resultCanvas.getContext('2d');

          if (resultCtx && canvasRef.current) {
            resultCtx.drawImage(canvasRef.current, 0, 0);
          }

          // Cleanup buffers (texture and program are managed by WebGL manager)
          gl.deleteBuffer(positionBuffer);
          gl.deleteBuffer(texCoordBuffer);

          return resultCanvas;
        } catch (err) {
          const errorContext = createErrorContext('apply-shader', {
            shaderName: shader.name,
            error: err instanceof Error ? err.message : String(err),
          });
          throw new MediaProcessorError('Failed to apply shader', errorContext, false);
        }
      });
    },
    [performanceMonitor, initializeWebGL, createShaderProgram, createTexture]
  );

  // ============================================================================
  // Export & Encoding
  // ============================================================================

  const canvasToBlob = useCallback((
    canvas: HTMLCanvasElement,
    options: ProcessingOptions
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const mimeType = `image/${options.format}`;
      const quality = options.compression;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        mimeType,
        quality
      );
    });
  }, []);

  const processImage = useCallback(
    async (
      asset: MediaAsset,
      operations: readonly CanvasOperation[],
      options: ProcessingOptions
    ): Promise<Blob> => {
      const errorContext = createErrorContext('process-image', {
        assetId: asset.id,
        operationCount: operations.length,
        quality: options.quality,
      });

      return performanceMonitor.measureOperation('process-image', async () => {
        try {
          setIsProcessing(true);
          setError(null);
          setProgress({ stage: 'loading', progress: 0 });

          // Load the image
          const img = await loadImage(asset.url);
          setProgress({ stage: 'processing', progress: 20 });

          let currentCanvas: HTMLCanvasElement | HTMLImageElement = img;

          // Apply operations sequentially
          for (const [index, operation] of operations.entries()) {
            const progressValue = 20 + ((index + 1) / operations.length) * 60;
            setProgress({ stage: 'processing', progress: progressValue });

            switch (operation.type) {
              case 'crop': {
                const { x, y, width, height } = operation.params as {
                  x: number;
                  y: number;
                  width: number;
                  height: number;
                };
                currentCanvas = cropImage(currentCanvas as HTMLImageElement, x, y, width, height);
                break;
              }
              case 'resize': {
                const { width, height } = operation.params as { width: number; height: number };
                currentCanvas = resizeImage(currentCanvas as HTMLImageElement, width, height);
                break;
              }
              case 'rotate': {
                const { degrees } = operation.params as { degrees: number };
                currentCanvas = rotateImage(currentCanvas as HTMLImageElement, degrees);
                break;
              }
              case 'flip': {
                const { horizontal, vertical } = operation.params as {
                  horizontal: boolean;
                  vertical: boolean;
                };
                currentCanvas = flipImage(currentCanvas as HTMLImageElement, horizontal, vertical);
                break;
              }
              default:
                logger.warn('Unknown operation type', { type: operation.type });
                break;
            }
          }

          setProgress({ stage: 'encoding', progress: 85 });

          // Convert to blob (ensure we have a canvas)
          const finalCanvas =
            currentCanvas instanceof HTMLCanvasElement
              ? currentCanvas
              : (() => {
                  const temp = document.createElement('canvas');
                  temp.width = currentCanvas.width;
                  temp.height = currentCanvas.height;
                  const ctx = temp.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(currentCanvas, 0, 0);
                  }
                  return temp;
                })();

          const blob = await canvasToBlob(finalCanvas, options);

          setProgress({ stage: 'complete', progress: 100 });
          setIsProcessing(false);

          logger.info('Image processing completed', {
            assetId: asset.id,
            operations: operations.length,
            finalWidth: finalCanvas.width,
            finalHeight: finalCanvas.height,
          });

          return blob;
        } catch (err) {
          const enhancedContext = enhanceErrorContext(errorContext, {
            error: err instanceof Error ? err.message : String(err),
          });

          const processorError =
            err instanceof MediaProcessorError
              ? err
              : new MediaProcessorError(
                  err instanceof Error ? err.message : 'Image processing failed',
                  enhancedContext,
                  false
                );

          setError(processorError);
          setIsProcessing(false);
          logger.error('Image processing failed', processorError, enhancedContext);
          throw processorError;
        }
      });
    },
    [performanceMonitor, loadImage, cropImage, resizeImage, rotateImage, flipImage, canvasToBlob]
  );

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      // Cleanup WebGL resources
      if (webglManagerRef.current) {
        webglManagerRef.current.cleanup();
        webglManagerRef.current = null;
      }

      logger.info('Media processor cleaned up');
    };
  }, []);

  // Helper function for error context enhancement
  function enhanceErrorContext(
    context: MediaErrorContext,
    additional: Record<string, unknown>
  ): MediaErrorContext {
    return { ...context, ...additional };
  }

  return {
    // State
    isProcessing,
    progress,
    error,

    // Core operations
    processImage,
    loadImage,
    loadVideo,
    extractVideoFrame,

    // Canvas operations
    cropImage,
    resizeImage,
    rotateImage,
    flipImage,

    // Advanced operations
    applyShader,
    createShaderProgram,
    createTexture,

    // Utilities
    canvasToBlob,
  };
}
