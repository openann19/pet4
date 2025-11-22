/**
 * Media Processing Error Types
 * Custom error classes for media processing operations with structured context
 */

// ============================================================================
// Base Error Class
// ============================================================================

export interface MediaErrorContext {
  readonly operation: string;
  readonly parameters?: Record<string, unknown>;
  readonly timestamp?: number;
  readonly duration?: number;
  readonly stage?: string;
  readonly [key: string]: unknown;
}

export class MediaProcessingError extends Error {
  readonly context: MediaErrorContext;
  readonly code: string;
  readonly recoverable: boolean;

  constructor(
    message: string,
    context: MediaErrorContext,
    code: string,
    recoverable = false
  ) {
    super(message);
    this.name = 'MediaProcessingError';
    this.context = context;
    this.code = code;
    this.recoverable = recoverable;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// ============================================================================
// Background Removal Errors
// ============================================================================

export class BackgroundRemovalError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'BACKGROUND_REMOVAL_ERROR', recoverable);
    this.name = 'BackgroundRemovalError';
  }
}

// ============================================================================
// Filter Errors
// ============================================================================

export class FilterError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'FILTER_ERROR', recoverable);
    this.name = 'FilterError';
  }
}

export class LUTError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'LUT_ERROR', recoverable);
    this.name = 'LUTError';
  }
}

// ============================================================================
// Media Processor Errors
// ============================================================================

export class MediaProcessorError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'MEDIA_PROCESSOR_ERROR', recoverable);
    this.name = 'MediaProcessorError';
  }
}

export class WebGLError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'WEBGL_ERROR', recoverable);
    this.name = 'WebGLError';
  }
}

export class ShaderCompilationError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'SHADER_COMPILATION_ERROR', recoverable);
    this.name = 'ShaderCompilationError';
  }
}

export class TextureError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'TEXTURE_ERROR', recoverable);
    this.name = 'TextureError';
  }
}

// ============================================================================
// Smart Resize Errors
// ============================================================================

export class SmartResizeError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'SMART_RESIZE_ERROR', recoverable);
    this.name = 'SmartResizeError';
  }
}

export class FaceDetectionError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'FACE_DETECTION_ERROR', recoverable);
    this.name = 'FaceDetectionError';
  }
}

export class SeamCarvingError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'SEAM_CARVING_ERROR', recoverable);
    this.name = 'SeamCarvingError';
  }
}

// ============================================================================
// Video Timeline Errors
// ============================================================================

export class VideoTimelineError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'VIDEO_TIMELINE_ERROR', recoverable);
    this.name = 'VideoTimelineError';
  }
}

export class VideoFrameError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'VIDEO_FRAME_ERROR', recoverable);
    this.name = 'VideoFrameError';
  }
}

export class WaveformError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'WAVEFORM_ERROR', recoverable);
    this.name = 'WaveformError';
  }
}

export class VideoExportError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'VIDEO_EXPORT_ERROR', recoverable);
    this.name = 'VideoExportError';
  }
}

// ============================================================================
// Worker Pool Errors
// ============================================================================

export class WorkerPoolError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'WORKER_POOL_ERROR', recoverable);
    this.name = 'WorkerPoolError';
  }
}

export class WorkerTaskError extends MediaProcessingError {
  constructor(message: string, context: MediaErrorContext, recoverable = false) {
    super(message, context, 'WORKER_TASK_ERROR', recoverable);
    this.name = 'WorkerTaskError';
  }
}

// ============================================================================
// Error Recovery Strategies
// ============================================================================

export interface ErrorRecoveryStrategy {
  readonly type: 'retry' | 'fallback' | 'skip' | 'abort';
  readonly maxRetries?: number;
  readonly fallbackOperation?: string;
  readonly delay?: number;
}

export function getRecoveryStrategy(error: MediaProcessingError): ErrorRecoveryStrategy {
  // WebGL errors are usually not recoverable, but we can fallback to CPU
  if (error instanceof WebGLError) {
    return {
      type: 'fallback',
      fallbackOperation: 'cpu',
    };
  }

  // Network/timeout errors can be retried
  if (error.code.includes('TIMEOUT') || error.code.includes('NETWORK')) {
    return {
      type: 'retry',
      maxRetries: 3,
      delay: 1000,
    };
  }

  // Worker errors can be retried or fallback to main thread
  if (error instanceof WorkerPoolError) {
    return {
      type: 'fallback',
      fallbackOperation: 'main-thread',
    };
  }

  // Recoverable errors can be retried
  if (error.recoverable) {
    return {
      type: 'retry',
      maxRetries: 2,
      delay: 500,
    };
  }

  // Default: abort
  return {
    type: 'abort',
  };
}

// ============================================================================
// Error Context Helpers
// ============================================================================

export function createErrorContext(
  operation: string,
  additionalContext?: Record<string, unknown>
): MediaErrorContext {
  return {
    operation,
    timestamp: Date.now(),
    ...additionalContext,
  };
}

export function enhanceErrorContext(
  context: MediaErrorContext,
  additionalContext: Record<string, unknown>
): MediaErrorContext {
  return {
    ...context,
    ...additionalContext,
  };
}
